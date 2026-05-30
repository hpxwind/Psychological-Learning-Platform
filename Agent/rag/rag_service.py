"""
RAG 总结服务类
支持多分区：用户提问，搜索指定分区的参考资料，将提问和参考资料提交给模型，让模型总结回复
"""
from typing import Optional, List
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from .vector_store import VectorStoreService, partition_manager
from utils.prompt_loader import load_rag_prompts
from utils.logger_handler import logger
from langchain_core.prompts import PromptTemplate
from model.factory import chat_model


def print_prompt(prompt):
    """
    辅助函数：打印完整提示词内容，用于调试查看
    Args:
        prompt: 格式化后的提示词模板对象
    Returns:
        原始提示词对象
    """
    print("=" * 20)
    print(prompt.to_string())
    print("=" * 20)
    return prompt


class RagSummarizeService:
    """
    RAG-based summarization service class
    基于 RAG 的问答总结服务类
    Core functions: Retrieve relevant docs → Generate answer with LLM
    核心功能：检索相关文档 → 调用大模型生成答案
    支持指定分区的向量库搜索
    """

    def __init__(self, partition_id: Optional[str] = None):
        """
        类初始化方法
        Initialize vector store, retriever, prompt, LLM and inference chain
        初始化向量库、检索器、提示词、大模型和推理链
        :param partition_id: 可选的分区ID，指定从哪个分区的向量库检索
        """
        # 保存分区ID
        self.partition_id = partition_id
        # 初始化向量存储服务
        self.vector_store = VectorStoreService(partition_id=partition_id)
        # 加载 RAG 提示词模板文本
        self.prompt_text = load_rag_prompts()
        # 转换为 LangChain 提示词模板对象
        self.prompt_template = PromptTemplate.from_template(self.prompt_text)
        # 绑定大语言模型
        self.model = chat_model
        # 构建完整的推理调用链
        self.chain = self.__init__chain()

    def __init__chain(self):
        """
        私有方法：构建大模型推理调用链
        Chain structure: Prompt → Print Debug → LLM → String Output Parser
        链结构：提示词 → 调试打印 → 大模型 → 字符串解析器
        Returns:
            Callable LangChain chain 可调用的LangChain链
        """
        chain = self.prompt_template | print_prompt | self.model | StrOutputParser()
        return chain

    def retriever_docs(self, query: str) -> List[Document]:
        """
        根据用户问题从向量库检索相关参考文档
        每次调用动态创建 retriever，避免缓存导致的陈旧连接问题
        Args:
            query: 用户的提问文本
        Returns:
            匹配到的文档对象列表
        """
        retriever = self.vector_store.get_retriever()
        return retriever.invoke(query)

    def rag_summarize(self, query: str) -> str:
        """
        核心方法：执行 RAG 流程并返回总结后的答案
        Step 1: 检索相关文档
        Step 2: 拼接文档为上下文文本
        Step 3: 调用模型链获取结果
        Args:
            query: 用户输入的问题
        Returns:
            最终总结生成的答案
        """
        # Step 1: 从向量数据库获取相关参考文档
        context_docs = self.retriever_docs(query)

        # Step 2: 将所有检索到的文档拼接成上下文字符串
        context = ""
        counter = 0
        for doc in context_docs:
            counter += 1
            partition_info = doc.metadata.get("partition_id", "default")
            source_file = doc.metadata.get("source_file", "unknown")
            context += f"[参考资料:{counter}] 来源分区:{partition_info} | 来源文件:{source_file} | 内容:{doc.page_content}\n"

        # Step 3: 将问题和上下文传入模型链，获取最终回答
        return self.chain.invoke(
            {
                "input": query,
                "context": context,
            }
        )


# 全局 RAG 服务实例缓存
_rag_service_cache: dict = {}


def get_rag_service(partition_id: Optional[str] = None) -> RagSummarizeService:
    """
    获取 RAG 服务实例（支持分区缓存）
    :param partition_id: 分区ID，None 表示全局分区
    :return: RAG 服务实例
    """
    cache_key = partition_id or "default"
    if cache_key not in _rag_service_cache:
        _rag_service_cache[cache_key] = RagSummarizeService(partition_id=partition_id)
    return _rag_service_cache[cache_key]


def clear_rag_cache(partition_id: Optional[str] = None):
    """
    清除 RAG 服务缓存，用于文件上传后刷新检索连接
    :param partition_id: 分区ID，None 表示清除所有缓存
    """
    global _rag_service_cache
    if partition_id:
        cache_key = partition_id
        if cache_key in _rag_service_cache:
            del _rag_service_cache[cache_key]
            logger.info(f"[+][Cache] Cleared RAG cache for partition: {partition_id}")
    else:
        _rag_service_cache.clear()
        logger.info("[+][Cache] Cleared all RAG caches")


# if __name__ == '__main__':
#     # 创建 RAG 服务实例（指定分区）
#     rag = RagSummarizeService(partition_id="test_partition")
#     # 调用核心方法获取答案
#     res = rag.rag_summarize("查询示例")
#     # 打印最终结果
#     print(res)
