"""
Agent HTTP API 服务
使用 FastAPI 提供 REST API，支持多分区管理和智能搜索
"""
import os
import shutil
import uuid
from typing import Optional, List
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 添加 agent 目录到路径
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rag.vector_store import VectorStoreService, partition_manager
from rag.rag_service import get_rag_service, clear_rag_cache


# ============== Pydantic 模型定义 ==============

class PartitionCreate(BaseModel):
    """创建分区请求模型"""
    id: str
    name: str = ""
    description: str = ""


class PartitionResponse(BaseModel):
    """分区响应模型"""
    id: str
    name: str
    description: str
    created_at: str
    file_count: int


class SearchRequest(BaseModel):
    """搜索请求模型"""
    query: str
    partition_id: Optional[str] = None
    k: int = 3


class CelebrityChatRequest(BaseModel):
    """名人对话请求模型"""
    celebrity_id: str
    constraint: str = ""    # 角色约束（定义身份和能力）
    query: str             # 用户问题
    partition_id: Optional[str] = None
    k: int = 3


class FileResponse(BaseModel):
    """文件响应模型"""
    name: str
    path: str
    md5: Optional[str]
    size: int


class ApiResponse(BaseModel):
    """通用 API 响应模型"""
    success: bool
    message: str
    data: Optional[dict] = None


# ============== FastAPI 应用 ==============

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info("[+][API Server] FastAPI server starting...")
    yield
    logger.info("[+][API Server] FastAPI server shutting down...")


app = FastAPI(
    title="Agent File Management API",
    description="多分区文件管理和智能搜索 API",
    version="1.0.0",
    lifespan=lifespan
)

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 导入日志器
from utils.logger_handler import logger


# ============== 分区管理接口 ==============

@app.post("/api/partitions", response_model=ApiResponse)
async def create_partition(partition: PartitionCreate):
    """
    创建新分区
    为每个分区创建独立的向量库和数据目录
    """
    try:
        result = partition_manager.create_partition(
            partition_id=partition.id,
            name=partition.name,
            description=partition.description
        )
        return ApiResponse(
            success=True,
            message=f"分区 {partition.id} 创建成功",
            data=result
        )
    except Exception as e:
        logger.error(f"[-][API] Create partition failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/partitions", response_model=ApiResponse)
async def list_partitions():
    """
    获取所有分区列表
    """
    try:
        partitions = partition_manager.get_partitions()
        return ApiResponse(
            success=True,
            message="获取分区列表成功",
            data={"partitions": partitions}
        )
    except Exception as e:
        logger.error(f"[-][API] List partitions failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/partitions/{partition_id}", response_model=ApiResponse)
async def get_partition(partition_id: str):
    """
    获取指定分区信息
    """
    try:
        partition = partition_manager.get_partition(partition_id)
        if not partition:
            raise HTTPException(status_code=404, detail=f"分区 {partition_id} 不存在")
        return ApiResponse(
            success=True,
            message="获取分区信息成功",
            data=partition
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[-][API] Get partition failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/partitions/{partition_id}", response_model=ApiResponse)
async def delete_partition(partition_id: str):
    """
    删除分区及其所有数据
    """
    try:
        success = partition_manager.delete_partition(partition_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"分区 {partition_id} 不存在")
        return ApiResponse(
            success=True,
            message=f"分区 {partition_id} 删除成功"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[-][API] Delete partition failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== 文件管理接口 ==============

@app.post("/api/partitions/{partition_id}/files", response_model=ApiResponse)
async def upload_file(partition_id: str, file: UploadFile = File(...)):
    """
    上传文件到指定分区
    文件会被复制到分区的 data 目录并自动加载到向量库
    """
    try:
        partition_info = partition_manager.get_partition(partition_id)
        if not partition_info:
            raise HTTPException(status_code=404, detail=f"分区 {partition_id} 不存在")

        data_dir = partition_info.get("data_dir", "")
        if not data_dir:
            raise HTTPException(status_code=500, detail="分区目录配置错误")

        # 生成安全的文件名
        file_name = file.filename or f"{uuid.uuid4().hex}"
        file_path = os.path.join(data_dir, file_name)

        # 保存文件
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 加载文件到向量库
        vs = VectorStoreService(partition_id=partition_id)
        vs.add_file(file_path)

        # 清除该分区的 RAG 缓存，确保后续检索使用最新数据
        clear_rag_cache(partition_id=partition_id)

        logger.info(f"[+][API] File {file_name} uploaded to partition {partition_id}")

        return ApiResponse(
            success=True,
            message=f"文件 {file_name} 上传成功并已加载到向量库",
            data={
                "file_name": file_name,
                "file_path": file_path,
                "partition_id": partition_id
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[-][API] Upload file failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/partitions/{partition_id}/files", response_model=ApiResponse)
async def list_partition_files(partition_id: str):
    """
    获取分区文件列表
    """
    try:
        partition_info = partition_manager.get_partition(partition_id)
        if not partition_info:
            raise HTTPException(status_code=404, detail=f"分区 {partition_id} 不存在")

        vs = VectorStoreService(partition_id=partition_id)
        files = vs.get_files()

        return ApiResponse(
            success=True,
            message="获取文件列表成功",
            data={
                "partition_id": partition_id,
                "files": files,
                "total": len(files)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[-][API] List files failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/partitions/{partition_id}/files/{file_name:path}", response_model=ApiResponse)
async def delete_file(partition_id: str, file_name: str):
    """
    删除分区中的指定文件
    """
    try:
        partition_info = partition_manager.get_partition(partition_id)
        if not partition_info:
            raise HTTPException(status_code=404, detail=f"分区 {partition_id} 不存在")

        file_path = os.path.join(partition_info.get("data_dir", ""), file_name)
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"[+][API] File {file_name} deleted from partition {partition_id}")
            return ApiResponse(
                success=True,
                message=f"文件 {file_name} 删除成功"
            )
        else:
            raise HTTPException(status_code=404, detail=f"文件 {file_name} 不存在")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[-][API] Delete file failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/partitions/{partition_id}/files/{file_name:path}/download")
async def download_file(partition_id: str, file_name: str):
    """
    下载分区中的指定文件
    """
    try:
        partition_info = partition_manager.get_partition(partition_id)
        if not partition_info:
            raise HTTPException(status_code=404, detail=f"分区 {partition_id} 不存在")

        file_path = os.path.join(partition_info.get("data_dir", ""), file_name)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"文件 {file_name} 不存在")

        from fastapi.responses import FileResponse
        return FileResponse(
            path=file_path,
            filename=file_name,
            media_type='application/octet-stream'
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[-][API] Download file failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== 智能搜索接口 ==============

@app.post("/api/search", response_model=ApiResponse)
async def search(request: SearchRequest):
    """
    智能搜索
    根据查询从指定分区（或全局）的向量库检索相关内容并生成回答
    """
    try:
        if not request.query:
            raise HTTPException(status_code=400, detail="查询内容不能为空")

        # 验证分区存在（如果指定了分区）
        if request.partition_id:
            partition = partition_manager.get_partition(request.partition_id)
            if not partition:
                raise HTTPException(status_code=404, detail=f"分区 {request.partition_id} 不存在")

        # 获取 RAG 服务
        rag = get_rag_service(partition_id=request.partition_id)

        # 执行搜索和回答
        result = rag.rag_summarize(request.query)

        # 获取检索到的文档用于调试/展示
        docs = rag.retriever_docs(request.query)
        source_docs = [
            {
                "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                "partition_id": doc.metadata.get("partition_id", "default"),
                "source_file": doc.metadata.get("source_file", "unknown")
            }
            for doc in docs
        ]

        logger.info(f"[+][API] Search completed for query: {request.query[:50]}...")

        return ApiResponse(
            success=True,
            message="搜索完成",
            data={
                "query": request.query,
                "partition_id": request.partition_id or "default",
                "answer": result,
                "sources": source_docs
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[-][API] Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search/vector", response_model=ApiResponse)
async def search_vector(
    query: str = Query(..., description="搜索查询"),
    partition_id: Optional[str] = Query(None, description="分区ID")
):
    """
    仅向量检索（不调用 LLM 生成回答）
    """
    try:
        vs = VectorStoreService(partition_id=partition_id)
        retriever = vs.get_retriever(k=5)
        docs = retriever.invoke(query)

        results = [
            {
                "content": doc.page_content,
                "partition_id": doc.metadata.get("partition_id", "default"),
                "source_file": doc.metadata.get("source_file", "unknown"),
                "score": "N/A"
            }
            for doc in docs
        ]

        return ApiResponse(
            success=True,
            message="向量检索完成",
            data={
                "query": query,
                "partition_id": partition_id or "default",
                "results": results,
                "total": len(results)
            }
        )
    except Exception as e:
        logger.error(f"[-][API] Vector search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== 名人对话接口 ==============

@app.post("/api/celebrity/chat", response_model=ApiResponse)
async def celebrity_chat(request: CelebrityChatRequest):
    """
    名人对话（严格知识库模式）
    - 必须基于知识库内容回答，不允许超出知识库范围
    - 知识库无相关内容时，直接拒绝回答
    - 所有回答必须符合角色约束中定义的身份和风格
    """
    try:
        if not request.query:
            raise HTTPException(status_code=400, detail="查询内容不能为空")

        # 1. 必须指定分区，否则无法检索知识库
        if not request.partition_id:
            return ApiResponse(
                success=True,
                message="未配置知识库",
                data={
                    "query": request.query,
                    "celebrity_id": request.celebrity_id,
                    "answer": "（未配置知识库分区，无法回答。）",
                    "sources": []
                }
            )

        # 2. 验证分区存在
        partition = partition_manager.get_partition(request.partition_id)
        if not partition:
            return ApiResponse(
                success=True,
                message="知识库不存在",
                data={
                    "query": request.query,
                    "celebrity_id": request.celebrity_id,
                    "answer": "（该名人的知识库尚未创建，请先上传知识库文件。）",
                    "sources": []
                }
            )

        # 3. 检索知识库
        try:
            rag = get_rag_service(partition_id=request.partition_id)
            context_docs = rag.retriever_docs(request.query)
        except Exception as e:
            logger.error(f"[-][API] RAG retrieval failed for partition {request.partition_id}: {e}")
            return ApiResponse(
                success=True,
                message="知识库检索失败",
                data={
                    "query": request.query,
                    "celebrity_id": request.celebrity_id,
                    "answer": "（知识库尚在索引中，请稍后再试。）",
                    "sources": []
                }
            )

        # 4. 无匹配内容 → 拒绝回答
        if not context_docs:
            logger.info(f"[+][API] Celebrity chat: {request.celebrity_id} query '{request.query[:50]}...' → 知识库无匹配，拒绝回答")
            return ApiResponse(
                success=True,
                message="知识库中无相关内容",
                data={
                    "query": request.query,
                    "celebrity_id": request.celebrity_id,
                    "answer": "（知识库中没有与该问题相关的内容，我无法回答。请尝试提出与我所学领域相关的问题。）",
                    "sources": []
                }
            )

        # 5. 构建上下文（仅使用知识库检索结果）
        context = ""
        for i, doc in enumerate(context_docs, 1):
            source_file = doc.metadata.get("source_file", "unknown")
            context += f"[参考资料{i}] 来源:{source_file}\n{doc.page_content}\n\n"

        source_docs = [
            {
                "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                "source_file": doc.metadata.get("source_file", "unknown")
            }
            for doc in context_docs
        ]

        # 6. 构建严格知识库提示词
        from langchain_core.prompts import PromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        celebrity_prompt = PromptTemplate.from_template(
            """{constraint}

以下是知识库中的权威内容，你的回答必须严格基于这些内容：
{context}

用户提问：{input}

【重要规则】
1. 严格以上述"知识库中的权威内容"为依据回答，不得编造、推测或引入知识库之外的信息。
2. 请用上述角色约束中定义的身份和风格来表达，使用第一人称。
3. 如果知识库内容只是部分相关，仅回答有依据的部分，明确告知用户哪些是你的知识范围之外的问题。
4. 用中文回答，语气自然。"""
        )

        # 7. 使用通义千问（DashScope）生成回答
        from model.factory import chat_model as default_model
        model = rag.model if rag else default_model

        chain = celebrity_prompt | model | StrOutputParser()
        result = chain.invoke({
            "constraint": request.constraint or "",
            "context": context,
            "input": request.query
        })

        logger.info(f"[+][API] Celebrity chat: {request.celebrity_id} query: {request.query[:50]}... → answered ({len(context_docs)} docs)")

        return ApiResponse(
            success=True,
            message="对话完成",
            data={
                "query": request.query,
                "celebrity_id": request.celebrity_id,
                "answer": result,
                "sources": source_docs
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[-][API] Celebrity chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== 健康检查 ==============

@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {"status": "healthy", "service": "agent-api"}


@app.get("/api/partitions/{partition_id}/reload", response_model=ApiResponse)
async def reload_partition_files(partition_id: str):
    """
    重新加载分区内的所有文件到向量库
    用于批量添加文件后刷新向量库
    """
    try:
        partition_info = partition_manager.get_partition(partition_id)
        if not partition_info:
            raise HTTPException(status_code=404, detail=f"分区 {partition_id} 不存在")

        vs = VectorStoreService(partition_id=partition_id)
        vs.load_document()  # 增量加载，会跳过已处理的文件

        return ApiResponse(
            success=True,
            message=f"分区 {partition_id} 文件重新加载完成",
            data={"partition_id": partition_id}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[-][API] Reload partition files failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== 启动入口 ==============

def start_server(host: str = "0.0.0.0", port: int = 8000):
    """启动 API 服务器"""
    import uvicorn
    logger.info(f"[+][API] Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    start_server()
