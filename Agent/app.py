import streamlit as st
import sys
import os
import time

# Add the project root directory to Python path to resolve import issues
# 将项目根目录添加到Python路径，解决导入问题
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the core ReAct Agent class
# 导入核心的ReAct智能体类
from agent.react_agent import ReactAgent

# Set the title of the Streamlit web page
# 设置Streamlit网页的标题
st.title("文件智能搜索助手")

# Insert a divider line on the page
# 在页面中插入一条分割线
st.divider()

# Initialize the Agent instance in session state if it doesn't exist
# 如果会话状态中不存在智能体实例，则进行初始化
if "agent" not in st.session_state:
    st.session_state["agent"] = ReactAgent()

# Initialize the chat message history in session state if it doesn't exist
# 如果会话状态中不存在聊天记录，则进行初始化
if "message" not in st.session_state:
    st.session_state["message"] = []

# Iterate and display all historical chat messages
# 遍历并展示所有历史聊天消息
for message in st.session_state["message"]:
    st.chat_message(message["role"]).write(message["content"])

# Create an input box for the user to type questions
# 创建输入框，供用户输入问题
prompt = st.chat_input()

# Check if the user has submitted a prompt
# 检查用户是否提交了问题
if prompt:
    # Display the user's message in the chat interface
    # 在聊天界面显示用户消息
    st.chat_message("user").write(prompt)
    # Save the user's message to the session state history
    # 将用户消息保存到会话状态历史记录
    st.session_state["message"].append({"role":"user", "content":prompt})

    # List to cache the streaming response chunks
    # 用于缓存流式响应片段的列表
    response_messages = []
    
    # Show a loading spinner while the agent is thinking
    # 当智能体思考时，显示加载动画
    with st.spinner("思考中..."):
        # Get the streaming response generator from the agent
        # 从智能体获取流式响应生成器
        res_stream = st.session_state["agent"].execute_stream(prompt)

        # Define a wrapper function to capture and simulate typing effect
        # 定义包装函数，用于捕获响应并模拟打字效果
        def capture(generator, cache_list):
            # Iterate over each chunk from the response generator
            # 遍历响应生成器的每个片段
            for chunk in generator:
                # Cache the chunk for saving the full message later
                # 缓存片段，用于后续保存完整消息
                cache_list.append(chunk)
                # Simulate typewriter effect by yielding character by character
                # 逐字输出，模拟打字机效果
                for char in chunk:
                    time.sleep(0.01)
                    yield char

        # Display the assistant's streaming response with typing effect
        # 显示助手的流式响应，并带有打字效果
        st.chat_message("assistant").write_stream(capture(res_stream, response_messages))
        
        # Save the complete response to the chat history
        # 将完整响应保存到聊天历史记录
        st.session_state["message"].append({"role":"assistant", "content":response_messages[-1]})
        
        # Rerun the app to refresh the interface and display the new message
        # 重新运行应用，刷新界面并显示新消息
        st.rerun()