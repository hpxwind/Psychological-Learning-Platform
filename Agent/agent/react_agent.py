from langchain.agents import create_agent
from model.factory import chat_model
from utils.prompt_loader import load_system_prompts
from agent.tools.agent_tools import rag_summarize, get_weather, get_user_id, get_user_location, \
    get_month, get_current_month, fetch_external_data, fill_context_for_report, list_partitions
from agent.tools.middleware import monitor_tool, log_before_model, report_prompt_switch


class ReactAgent:
    """
    A ReAct-based intelligent agent that integrates LLM, tools, and middleware.
    It supports tool calling, dynamic prompt switching, and streaming response output.
    基于ReAct架构的智能体，集成大模型、工具集与中间件，支持工具调用、动态提示词切换与流式响应。
    """

    def __init__(self):
        """
        Initialize the ReAct agent with LLM, system prompt, tools, and middleware.
        初始化ReAct智能体，加载大模型、系统提示词、工具集与中间件。
        """
        # Create an agent instance using LangChain create_agent
        self.agent = create_agent(
            # Large language model for reasoning and answering
            model=chat_model,
            # Base system prompt for the agent
            system_prompt=load_system_prompts(),
            # List of available tools for the agent to use
            tools=[
                rag_summarize,
                get_weather,
                get_user_location,
                get_user_id,
                get_month,
                get_current_month,
                fetch_external_data,
                fill_context_for_report,
                list_partitions
            ],
            # Middleware for tool monitoring, logging, and dynamic prompt switching
            middleware=[
                monitor_tool,
                log_before_model,
                report_prompt_switch
            ]
        )

    def execute_stream(self, query: str):
        """
        Execute the agent query and return streaming response chunks.
        执行用户查询并以流式方式返回响应片段。

        Args:
            query: User input question or instruction / 用户输入的问题或指令

        Yields:
            Streaming response content chunk / 流式输出的响应内容片段
        """
        # Construct input data in the format required by the agent
        input_dict = {
            "messages": [
                {"role": "user", "content": query},
            ]
        }

        # Stream agent responses with context (report mode disabled by default)
        for chunk in self.agent.stream(input_dict, stream_mode="values", context={"report": False}):
            # Get the latest message from the state
            latest_message = chunk["messages"][-1]
            # Yield non-empty content
            if latest_message.content:
                yield latest_message.content.strip() + "\n"