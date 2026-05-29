"""
为整个工程提供统一的绝对路径
"""
import os

def get_project_root() -> str:
    """
    获取工程所在的根目录
    :return: 字符串根目录
    """
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get_abs_path(relative_path: str) -> str:
    """
    传递相对路径，得到绝对路径
    :param relative_path: 相对
    :return: 绝对
    """
    return os.path.join(get_project_root(), relative_path)


# if __name__ == "__main__":
#     print(get_abs_path("config\config.json"))