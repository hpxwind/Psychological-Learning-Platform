"""
多分区向量存储服务类
支持每个分区独立的 Chroma 数据库和数据文件夹
"""
import os
import json
import shutil
import hashlib
from typing import Optional, List, Dict
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from utils.config_handler import chroma_conf
from utils.path_tool import get_abs_path
from utils.logger_handler import logger
from utils.file_handler import (
    pdf_loader,
    txt_loader,
    listdir_with_allowed_type,
    get_file_md5_hex
)


class PartitionManager:
    """
    分区管理器：管理所有分区的元数据
    每个分区包含独立的向量库和数据文件夹
    """

    def __init__(self):
        self.base_dir = get_abs_path("")
        self.partitions_meta_file = os.path.join(self.base_dir, "partitions_meta.json")
        self.partitions: Dict[str, dict] = {}
        self._load_partitions_meta()

    def _load_partitions_meta(self):
        """从文件加载分区元数据"""
        if os.path.exists(self.partitions_meta_file):
            try:
                with open(self.partitions_meta_file, "r", encoding="utf-8") as f:
                    self.partitions = json.load(f)
                logger.info(f"[+][PartitionManager] Loaded {len(self.partitions)} partitions")
            except Exception as e:
                logger.error(f"[-][PartitionManager] Failed to load partitions meta: {e}")
                self.partitions = {}
        else:
            self.partitions = {}

    def _save_partitions_meta(self):
        """保存分区元数据到文件"""
        try:
            with open(self.partitions_meta_file, "w", encoding="utf-8") as f:
                json.dump(self.partitions, f, ensure_ascii=False, indent=2)
            logger.info(f"[+][PartitionManager] Saved partitions meta")
        except Exception as e:
            logger.error(f"[-][PartitionManager] Failed to save partitions meta: {e}")

    def get_partitions(self) -> List[dict]:
        """获取所有分区列表"""
        return [
            {
                "id": pid,
                "name": info.get("name", pid),
                "description": info.get("description", ""),
                "created_at": info.get("created_at", ""),
                "file_count": info.get("file_count", 0)
            }
            for pid, info in self.partitions.items()
        ]

    def get_partition(self, partition_id: str) -> Optional[dict]:
        """获取指定分区信息"""
        return self.partitions.get(partition_id)

    def create_partition(self, partition_id: str, name: str = "", description: str = "") -> dict:
        """
        创建新分区
        为分区创建独立的数据目录和向量库目录
        如果分区已存在但仍确保目录存在（防止删除后重建时目录丢失）
        """
        # 创建分区目录结构
        data_dir = os.path.join(self.base_dir, "data", "partitions", partition_id)
        chroma_dir = os.path.join(self.base_dir, "chroma_db", "partitions", partition_id)

        os.makedirs(data_dir, exist_ok=True)
        os.makedirs(chroma_dir, exist_ok=True)

        if partition_id in self.partitions:
            # 分区已存在：更新目录路径（可能因部署位置变更）并确保目录存在
            self.partitions[partition_id]["data_dir"] = data_dir
            self.partitions[partition_id]["chroma_dir"] = chroma_dir
            if name:
                self.partitions[partition_id]["name"] = name
            if description:
                self.partitions[partition_id]["description"] = description
            self._save_partitions_meta()
            logger.info(f"[+][PartitionManager] Partition {partition_id} already exists, ensured directories")
            return self.partitions[partition_id]

        from datetime import datetime
        self.partitions[partition_id] = {
            "name": name or partition_id,
            "description": description,
            "created_at": datetime.now().isoformat(),
            "file_count": 0,
            "data_dir": data_dir,
            "chroma_dir": chroma_dir
        }

        self._save_partitions_meta()
        logger.info(f"[+][PartitionManager] Created partition {partition_id}")
        return self.partitions[partition_id]

    def delete_partition(self, partition_id: str) -> bool:
        """删除分区及其所有数据"""
        if partition_id not in self.partitions:
            logger.warning(f"[-][PartitionManager] Partition {partition_id} not found")
            return False

        # 删除分区目录
        data_dir = self.partitions[partition_id].get("data_dir")
        chroma_dir = self.partitions[partition_id].get("chroma_dir")

        if data_dir and os.path.exists(data_dir):
            shutil.rmtree(data_dir, ignore_errors=True)
        if chroma_dir and os.path.exists(chroma_dir):
            shutil.rmtree(chroma_dir, ignore_errors=True)

        # 删除元数据
        del self.partitions[partition_id]
        self._save_partitions_meta()

        logger.info(f"[+][PartitionManager] Deleted partition {partition_id}")
        return True

    def update_partition_file_count(self, partition_id: str, count: int):
        """更新分区的文件数量"""
        if partition_id in self.partitions:
            self.partitions[partition_id]["file_count"] = count
            self._save_partitions_meta()


class VectorStoreService:
    """
    向量数据库服务类（支持多分区）
    Main functions: load documents -> split text -> embedding -> store into Chroma -> similarity retrieval
    """

    def __init__(self, partition_id: Optional[str] = None):
        """
        初始化向量数据库和文本分割器
        Step 1: 确定分区目录
        Step 2: 创建或连接 Chroma 向量数据库
        Step 3: 初始化文本分割器
        """
        self.partition_manager = PartitionManager()
        self.current_partition_id = partition_id

        if partition_id:
            # 使用指定分区的向量库
            partition_info = self.partition_manager.get_partition(partition_id)
            if not partition_info:
                raise ValueError(f"Partition {partition_id} not found")

            chroma_dir = partition_info.get("chroma_dir", "")
            # ChromaDB 集合名仅支持 [a-zA-Z0-9._-]，用 MD5 哈希避免中文等问题
            partition_hash = hashlib.md5(partition_id.encode('utf-8')).hexdigest()[:16]
            collection_name = f"p_{partition_hash}"
            self.md5_file = os.path.join(chroma_dir, f"md5_{partition_id}.txt")
            self.data_path = partition_info.get("data_dir", "")
        else:
            # 使用默认全局向量库
            chroma_dir = get_abs_path(chroma_conf["persist_directory"])
            collection_name = chroma_conf["collection_name"]
            self.md5_file = get_abs_path(chroma_conf["md5_hex_store"])
            self.data_path = get_abs_path(chroma_conf["data_path"])

        # 初始化 Chroma 向量存储
        self.vector_store = Chroma(
            collection_name=collection_name,
            embedding_function=embed_model,
            persist_directory=chroma_dir,
        )

        # 初始化递归字符文本分割器
        self.spliter = RecursiveCharacterTextSplitter(
            chunk_size=chroma_conf["chunk_size"],
            chunk_overlap=chroma_conf["chunk_overlap"],
            separators=chroma_conf["separators"],
        )

    def get_retriever(self, k: int = 3, fetch_k: int = 10):
        """
        获取文档检索器用于相似度搜索
        search_type="mmr": Max Marginal Relevance，返回更多样化的结果
        k: 返回 top 3 相关文档
        fetch_k: 从 top 10 文档中筛选候选
        """
        return self.vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={"k": k, "fetch_k": fetch_k}
        )

    def check_md5_hex(self, md5_for_check: str) -> bool:
        """
        检查当前文件是否已通过 MD5 记录处理过
        :param md5_for_check: 当前文件的 md5 字符串
        :return: True -> 已处理过; False -> 新文件
        """
        if not os.path.exists(self.md5_file):
            open(self.md5_file, "w", encoding='utf-8').close()
            logger.error(f"[-][check_md5_hex] {self.md5_file} not found, auto created")
            return False

        with open(self.md5_file, "r", encoding='utf-8') as f:
            for line in f.readlines():
                line = line.strip()
                if line == md5_for_check:
                    return True
            return False

    def save_md5_hex(self, md5_for_check: str):
        """保存已处理文件的 md5 到记录文件"""
        with open(self.md5_file, "a", encoding='utf-8') as f:
            f.write(md5_for_check + "\n")

    def get_file_documents(self, read_path: str) -> list[Document]:
        """根据文件后缀加载文件内容"""
        if read_path.endswith("txt"):
            return txt_loader(read_path)
        if read_path.endswith("pdf"):
            return pdf_loader(read_path)
        return []

    def load_document(self, file_path: Optional[str] = None):
        """
        核心方法：批量加载本地文件到向量数据库
        支持增量加载特定分区的文件
        Workflow:
        1. 遍历允许的文件类型
        2. 计算文件 MD5 避免重复存储
        3. 加载 txt/pdf 内容
        4. 将长文本切分为小块
        5. 将块添加到 Chroma 向量存储
        6. 记录已处理文件的 MD5
        """
        # 如果指定了文件路径，只处理单个文件
        if file_path:
            self._load_single_file(file_path)
            return

        # 获取 data 目录下所有允许类型的文件
        allowed_files_path: list[str] = listdir_with_allowed_type(
            self.data_path,
            tuple(chroma_conf["allow_knowledge_file_type"]),
        )

        for path in allowed_files_path:
            self._load_single_file(path)

    def _load_single_file(self, path: str):
        """加载单个文件到向量库"""
        # 计算当前文件的 md5 值
        md5_hex = get_file_md5_hex(path)

        if not md5_hex:
            logger.error(f"[-][load_document]{path} MD5 calculate failed, skip")
            return

        # 如果文件已存在向量库中则跳过
        if self.check_md5_hex(md5_hex):
            logger.info(f"[+][load_document]{path} already in knowledge base, skip")
            return

        try:
            documents = self.get_file_documents(path)

            if not documents:
                logger.warning(f"[-][load_document]{documents} no valid text, skip")
                return

            split_document = self.spliter.split_documents(documents)

            if not split_document:
                logger.warning(f"[-][load_document]{documents}-{path} split empty, skip")
                return

            # 为文档添加分区元数据
            for doc in split_document:
                doc.metadata["partition_id"] = self.current_partition_id or "default"
                doc.metadata["source_file"] = os.path.basename(path)

            self.vector_store.add_documents(split_document)
            self.save_md5_hex(md5_hex)
            logger.info(f"[+][load_document]{documents}-{path} loaded to knowledge base successfully")

            # 更新分区文件计数
            if self.current_partition_id:
                file_count = len(listdir_with_allowed_type(
                    self.data_path,
                    tuple(chroma_conf["allow_knowledge_file_type"])
                ))
                self.partition_manager.update_partition_file_count(self.current_partition_id, file_count)

        except Exception as e:
            logger.error(f"[-][load_document]{path} load failed: {str(e)}", exc_info=True)

    def add_file(self, file_path: str) -> bool:
        """
        添加单个文件到向量库
        :param file_path: 文件的绝对路径或相对于分区 data 目录的路径
        :return: 是否添加成功
        """
        # 如果是绝对路径，直接使用
        if os.path.isabs(file_path) and os.path.exists(file_path):
            target_path = file_path
        else:
            # 否则复制到分区的 data 目录
            target_path = os.path.join(self.data_path, os.path.basename(file_path))
            if os.path.exists(file_path):
                shutil.copy2(file_path, target_path)
                logger.info(f"[+][add_file] Copied {file_path} to {target_path}")

        self._load_single_file(target_path)
        return True

    def get_files(self) -> List[dict]:
        """获取分区内的文件列表"""
        if not self.data_path or not os.path.exists(self.data_path):
            return []

        files = []
        for f in os.listdir(self.data_path):
            full_path = os.path.join(self.data_path, f)
            if os.path.isfile(full_path):
                md5 = get_file_md5_hex(full_path)
                stat = os.stat(full_path)
                files.append({
                    "name": f,
                    "path": full_path,
                    "md5": md5,
                    "size": stat.st_size,
                    "created_at": stat.st_ctime,
                    "modified_at": stat.st_mtime
                })
        
        # 按创建时间排序，最新的在前
        files.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        return files


# 全局分区管理器实例
partition_manager = PartitionManager()

# 动态导入 embedding model
from model.factory import embed_model

# if __name__ == "__main__":
#     # 创建分区
#     pm = PartitionManager()
#     pm.create_partition("test_partition", "测试分区", "这是一个测试分区")
#
#     # 使用分区向量库
#     vs = VectorStoreService(partition_id="test_partition")
#     # 批量加载本地文档到向量库
#     vs.load_document()
#     # 获取检索工具
#     retriever = vs.get_retriever()
#
#     # 按查询检索相关文档
#     res = retriever.invoke("迷路")
#
#     # 去重检索结果并打印
#     seen = set()
#     for r in res:
#         content = r.page_content.strip()
#         if content not in seen:
#             seen.add(content)
#             print(content)
#             print("-" * 20)
