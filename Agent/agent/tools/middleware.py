from typing import Callable

from langchain.agents import AgentState
from langchain.agents.middleware import wrap_tool_call, before_model, dynamic_prompt, ModelRequest
from langchain_core.messages import ToolMessage
from langgraph.prebuilt.tool_node import ToolCallRequest
from langgraph.runtime import Runtime
from langgraph.types import Command
from utils.logger_handler import logger
from utils.prompt_loader import load_report_prompts, load_system_prompts


@wrap_tool_call
def monitor_tool(
        request: ToolCallRequest,
        handler: Callable[[ToolCallRequest], ToolMessage | Command],
) -> ToolMessage | Command:
    """
    Middleware to monitor and log tool execution status.
    Logs tool name, arguments, success/failure, and updates runtime context for report mode.

    Args:
        request: Encapsulated tool call request with parameters and runtime info
        handler: The actual tool execution function to wrap

    Returns:
        ToolMessage or Command: Result from the tool execution
    """
    logger.info(f"[+][monitor_tool] Executing tool: {request.tool_call['name']}")
    logger.info(f"[+][monitor_tool] Parameters: {request.tool_call['args']}")

    try:
        result = handler(request)
        logger.info(f"[+][monitor_tool] Tool {request.tool_call['name']} executed successfully")

        if request.tool_call['name'] == "fill_context_for_report":
            request.runtime.context["report"] = True

        return result

    except Exception as e:
        logger.error(f"[-][monitor_tool] Tool {request.tool_call['name']} failed: {str(e)}")
        raise e


@before_model
def log_before_model(
        state: AgentState,
        runtime: Runtime,
):
    """
    Logs information before invoking the LLM.
    Includes safety checks to avoid index errors when accessing message history.

    Args:
        state: Current state of the agent containing message history
        runtime: Runtime context with execution metadata

    Returns:
        AgentState: Updated agent state
    """
    logger.info("[+][log_before_model] Preparing to call the large language model")

    if state.get("messages") and len(state["messages"]) > 0:
        last_msg = state["messages"][-1]
        if hasattr(last_msg, 'content') and last_msg.content:
            logger.debug(f"[+][log_before_model] {type(last_msg).__name__} | {last_msg.content.strip()}")

    return state


@dynamic_prompt
def report_prompt_switch(request: ModelRequest):
    """
    Dynamically switches system prompts based on runtime context.
    Uses report-specific prompt if report mode is activated; otherwise uses default prompt.

    Args:
        request: Model request containing runtime context flags

    Returns:
        str: Selected system prompt for the LLM
    """
    is_report = request.runtime.context.get("report", False)
    if is_report:
        return load_report_prompts()

    return load_system_prompts()