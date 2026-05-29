import os
import random
import requests
from typing import Optional
from langchain_core.tools import tool
from rag.rag_service import get_rag_service
from rag.vector_store import partition_manager
from utils.logger_handler import logger
from utils.config_handler import agent_conf
from utils.path_tool import get_abs_path


# List of 50 Chinese cities for weather query
# 50个中国城市列表，用于天气查询
city_arr = [
    "北京", "上海", "广州", "深圳", "成都", "重庆", "杭州", "武汉", "西安", "南京",
    "天津", "苏州", "长沙", "郑州", "东莞", "青岛", "沈阳", "合肥", "佛山", "无锡",
    "大连", "昆明", "厦门", "济南", "宁波", "福州", "哈尔滨", "长春", "石家庄", "南昌",
    "贵阳", "南宁", "太原", "兰州", "呼和浩特", "乌鲁木齐", "海口", "三亚", "珠海", "常州",
    "南通", "绍兴", "嘉兴", "徐州", "潍坊", "烟台", "洛阳", "保定", "宜昌", "荆州"
]

# List of user IDs (string format)
# 用户ID列表（字符串格式）
user_arr = [
    "1001", "1002", "1003", "1004", "1005",
    "1006", "1007", "1008", "1009", "1010",
    "2001", "2002", "2003", "2004", "2005",
    "2006", "2007", "2008", "2009", "2010",
    "2011", "2012", "2013", "2014", "2015",
    "2016", "2017", "2018", "2019", "2020"
]

# List of months for user data query
# 月份列表，用于查询用户月度数据
month_arr = ["2025-02", "2025-03", "2025-04", "2025-05", "2025-06"]


@tool(description="从向量数据库检索资料并通过大模型总结回答，支持指定分区")
def rag_summarize(query: str, partition_id: Optional[str] = None) -> str:
    """
    核心 RAG 工具：从向量库检索资料并通过大模型总结回答
    Args:
        query: 用户问题或搜索内容
        partition_id: 可选的分区ID，指定从哪个分区的向量库检索
    Returns:
        大模型返回的总结回答
    """
    try:
        rag = get_rag_service(partition_id=partition_id)
        result = rag.rag_summarize(query)
        if partition_id:
            logger.info(f"[+][rag_summarize] RAG query in partition {partition_id} completed")
        else:
            logger.info(f"[+][rag_summarize] RAG query in default partition completed")
        return result
    except Exception as e:
        logger.error(f"[-][rag_summarize] RAG query failed: {e}")
        return f"RAG 查询失败: {str(e)}"


@tool(description="获取所有可用的分区列表")
def list_partitions() -> str:
    """
    获取所有分区列表
    Returns:
        分区列表的格式化字符串
    """
    try:
        partitions = partition_manager.get_partitions()
        if not partitions:
            return "当前没有任何分区，请先创建分区"

        result = "可用的分区列表：\n"
        for p in partitions:
            result += f"- ID: {p['id']}, 名称: {p['name']}, 文件数: {p['file_count']}\n"
        return result
    except Exception as e:
        logger.error(f"[-][list_partitions] Failed: {e}")
        return f"获取分区列表失败: {str(e)}"


@tool(description="返回指定城市的实时天气")
def get_weather(city: str) -> str:
    """
    Query real-time weather using public free API
    使用公开免费API查询实时天气
    Args:
        city: Chinese city name  中文城市名称
    Returns:
        Formatted weather info string  格式化后的天气信息
    """
    # Public weather API endpoint
    # 公开天气接口
    url = f"http://wttr.in/{city}?format=3"

    try:
        # Send HTTP request with 5s timeout
        # 发送HTTP请求，超时时间5秒
        resp = requests.get(url, timeout=5)

        if resp.status_code == 200:
            logger.info(f"[+][get_weather] Weather query successful")
            return f"{city} real-time weather: {resp.text.strip()}"
        else:
            logger.info(f"[-][get_weather] Weather query failed")
            return f"Failed to get weather info for {city}"

    except Exception as e:
        logger.warning(f"[-][get_weather] Weather query error: {str(e)}")
        return f"Weather query exception: {str(e)}"


@tool(description="Get user's current location city")
def get_user_location() -> str:
    """
    Randomly select a city to simulate user location
    随机选择一个城市，模拟用户定位
    Returns:
        Random city name  随机城市名称
    """
    return random.choice(city_arr)


@tool(description="Get random user ID")
def get_user_id() -> str:
    """
    Randomly select a user ID from the list
    从列表中随机获取一个用户ID
    Returns:
        Random user ID  随机用户ID
    """
    return random.choice(user_arr)


@tool(description="Get random month")
def get_month() -> str:
    """
    Randomly select a month from the list
    从列表中随机获取一个月份
    Returns:
        Random month string  随机月份字符串
    """
    return random.choice(month_arr)


# Global dictionary to store external user data (user -> month -> data)
# 全局字典，存储外部用户数据：用户ID → 月份 → 详细信息
external_data = {}


def get_current_month():
    """
    Load external CSV data into global dictionary (one-time loading)
    将外部CSV数据加载到全局字典（仅加载一次）
    Steps:
        1. Get external data path  获取外部数据路径
        2. Check file existence    检查文件是否存在
        3. Read and parse CSV      读取并解析CSV
        4. Store in global dict    存入全局字典
    """
    # Load data only if the global dict is empty
    # 仅当全局字典为空时加载数据
    if not external_data:
        external_data_path = get_abs_path(agent_conf["external_data_path"])

        # Check if external data file exists
        # 检查外部数据文件是否存在
        if not os.path.exists(external_data_path):
            logger.error(f"[-][get_current_month] External file {external_data_path} not found")
            raise FileNotFoundError(f"External file {external_data_path} not found")

        # Open and read CSV line by line (skip header)
        # 打开并逐行读取CSV（跳过表头）
        with open(external_data_path, "r", encoding="utf-8") as f:
            for line in f.readlines()[1:]:
                arr: list[str] = line.strip().split(",")

                # Parse each field
                # 解析每个字段
                user_id: str = arr[0]
                house_info: str = arr[1].replace('"', "")
                metrics: str = arr[2].replace('"', "")
                comment: str = arr[3].replace('"', "")
                time: str = arr[4].replace('"', "")

                # Initialize user node if not exists
                # 如果用户不存在，初始化用户节点
                if user_id not in external_data:
                    external_data[user_id] = {}

                # Store monthly data under the user
                # 将月度数据存入对应用户
                external_data[user_id][time] = {
                    "house_info": house_info,
                    "metrics": metrics,
                    "comment": comment,
                }


@tool(description="Get user's monthly usage data from external system")
def fetch_external_data(user_id: str, month: str) -> str:
    """
    Query user's monthly usage data from preloaded external data
    从预加载的外部数据中查询用户月度使用记录
    Args:
        user_id: Target user ID      目标用户ID
        month: Target month (YYYY-MM)  查询月份
    Returns:
        User monthly data dict or empty string  用户月度数据或空字符串
    """
    # Ensure external data is loaded
    # 确保外部数据已加载
    get_current_month()

    try:
        # Return data by user ID and month
        # 根据用户ID和月份返回数据
        return external_data[user_id][month]

    except KeyError as e:
        # Log warning if data not found
        # 未找到数据时记录警告
        logger.warning(f"[-][fetch_external_data] No data for user {user_id} in {month}")
        return ""


@tool(description="调用后，触发中间件自动为报告生成的场景动态注入上下文信息，为后续提示词切换提供上下文信息")
def fill_context_for_report():
    return "[+]fill_context_for_report-已调用"


if __name__ == '__main__':
    res = fetch_external_data("1009", "2025-02")
    print(res)
