import os
import hashlib
from .logger_handler import logger
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader, TextLoader

def get_file_md5_hex(filepath: str):
    """获取文件md5，用于去重判断"""
    if not os.path.exists(filepath):
        logger.error(f"[-][get_file_md5_hex]文件{filepath}不存在")
        return None

    if not os.path.isfile(filepath):
        logger.error(f"[-][get_file_md5_hex]路径{filepath}不是文件")
        return None

    md5_o = hashlib.md5()
    chunk_size = 1024 * 4
    try:
        # 必须二进制读取
        with open(filepath, "rb") as f:
            while chunk := f.read(chunk_size):
                """ := 先赋值再运算"""
                md5_o.update(chunk)
        md5_hex = md5_o.hexdigest()
        return md5_hex
    except Exception as e:
        logger.error(f"[-][get_file_md5_hex]计算{filepath}的md5失败：{e}")
        return None

def listdir_with_allowed_type(path: str, allowed_types: tuple[str]):
    """返回文件夹的文件列表（允许的文件后缀）"""
    files = []
    if not os.path.isdir(path):
        logger.error(f"[-][listdir_with_allowed_type]当前路径{path}不是文件夹")
        return allowed_types

    for f in os.listdir(path):
        if f.endswith(allowed_types):
            files.append(os.path.join(path, f))

    # 转换元组避免被修改
    return tuple(files)

def pdf_loader(filepath: str, passw=None) -> list[Document]:
    """加载pdf"""
    return PyPDFLoader(filepath, passw).load()


def txt_loader(filepath: str) -> list[Document]:
    """加载文本文件"""
    return TextLoader(filepath, encoding='utf-8').load()