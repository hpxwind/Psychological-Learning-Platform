import type { Request, Response } from 'express'
import crypto from 'crypto'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  message: string
  image?: string
  history?: Array<{ role: string; content: string }>
}

/**
 * 生成腾讯云API签名（TC3-HMAC-SHA256）
 */
function generateTC3Signature(
  secretId: string,
  secretKey: string,
  service: string,
  action: string,
  payload: string,
  timestamp: number
): { authorization: string; headers: Record<string, string> } {
  const date = new Date(timestamp * 1000).toISOString().substr(0, 10)

  // 1. 拼接规范请求串
  const httpRequestMethod = 'POST'
  const canonicalUri = '/'
  const canonicalQueryString = ''
  const canonicalHeaders = `content-type:application/json\nhost:hunyuan.tencentcloudapi.com\nx-tc-action:${action.toLowerCase()}\n`
  const signedHeaders = 'content-type;host;x-tc-action'
  const hashedRequestPayload = crypto.createHash('sha256').update(payload).digest('hex')
  const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`

  // 2. 拼接待签名字符串
  const algorithm = 'TC3-HMAC-SHA256'
  const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  const credentialScope = `${date}/${service}/tc3_request`
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`

  // 3. 计算签名
  const secretDate = crypto.createHmac('sha256', `TC3${secretKey}`).update(date).digest()
  const secretService = crypto.createHmac('sha256', secretDate).update(service).digest()
  const secretSigning = crypto.createHmac('sha256', secretService).digest('tc3_request')
  const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex')

  // 4. 拼接 Authorization
  const authorization = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    authorization,
    headers: {
      'Authorization': authorization,
      'Content-Type': 'application/json',
      'Host': 'hunyuan.tencentcloudapi.com',
      'X-TC-Action': action,
      'X-TC-Timestamp': timestamp.toString(),
      'X-TC-Version': '2023-09-01',
      'X-TC-Region': 'ap-guangzhou'
    }
  }
}

/**
 * AI聊天控制器
 * 调用腾讯混元API进行对话
 * 推荐使用OpenAI格式API Key
 */
export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { message, image, history = [] }: ChatRequest = req.body

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        error: '消息不能为空'
      })
    }

    // 腾讯混元API配置
    const API_KEY = process.env.TENCENT_HUNYUAN_API_KEY
    const SECRET_ID = process.env.TENCENT_HUNYUAN_SECRET_ID
    const SECRET_KEY = process.env.TENCENT_HUNYUAN_SECRET_KEY

    // 检查配置
    const useOpenAIFormat = API_KEY?.startsWith('sk-')
    const useTencentFormat = SECRET_ID && SECRET_KEY

    if (!useOpenAIFormat && !useTencentFormat) {
      console.error('腾讯混元API密钥未配置')
      return res.status(500).json({
        success: false,
        error: 'AI服务未配置，请配置API密钥或SecretId/SecretKey'
      })
    }

    // 优先使用OpenAI格式（更简单）
    if (useOpenAIFormat) {
      console.log('使用OpenAI格式API调用')
      await callOpenAIFormat(API_KEY!, message, image, history, res)
    } else {
      console.log('使用腾讯云格式API调用')
      await callTencentFormat(SECRET_ID!, SECRET_KEY!, message, image, history, res)
    }

  } catch (error) {
    console.error('AI聊天错误:', error)
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      message: error instanceof Error ? error.message : '未知错误'
    })
  }
}

async function callOpenAIFormat(
  apiKey: string,
  message: string,
  image: string | undefined,
  history: Array<{ role: string; content: string }>,
  res: Response
) {
  // 构建系统提示词
  const systemPrompt = `你是一位专业的AI心理学助手，专注于心理学、精神分析和哲学领域的咨询。请遵循以下原则：

1. 只回答与心理学、精神分析、哲学相关的问题
2. 对于其他领域的问题，礼貌地说明你的专业范围
3. 回答要专业、客观、有建设性
4. 避免给出诊断性建议，如需专业帮助请建议用户咨询专业人士
5. 使用温暖、理解的语气
6. 引用知名心理学家或哲学家的理论时，尽量说明出处
7. 鼓励用户深入思考，提供多角度的观点

请始终用中文回答。`

  // 构建消息历史
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt }
  ]

  // 添加历史消息
  history.forEach((msg) => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })
    }
  })

  // 添加当前用户消息
  let userContent = message
  if (image) {
    userContent += `\n[用户上传了图片]`
  }
  messages.push({ role: 'user', content: userContent })

  const API_URL = 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions'

  console.log('请求URL:', API_URL)

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'hunyuan-lite',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: false
    })
  })

  console.log('响应状态:', response.status, response.statusText)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('腾讯混元API错误响应:', errorText)
    throw new Error(`API请求失败: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const reply = data.choices?.[0]?.message?.content || '抱歉，我暂时无法回答这个问题。'

  console.log('提取的回复:', reply)

  res.json({
    success: true,
    reply,
    timestamp: new Date().toISOString()
  })
}

async function callTencentFormat(
  secretId: string,
  secretKey: string,
  message: string,
  image: string | undefined,
  history: Array<{ role: string; content: string }>,
  res: Response
) {
  // 构建系统提示词
  const systemPrompt = `你是一位专业的AI心理学助手，专注于心理学、精神分析和哲学领域的咨询。请遵循以下原则：

1. 只回答与心理学、精神分析、哲学相关的问题
2. 对于其他领域的问题，礼貌地说明你的专业范围
3. 回答要专业、客观、有建设性
4. 避免给出诊断性建议，如需专业帮助请建议用户咨询专业人士
5. 使用温暖、理解的语气
6. 引用知名心理学家或哲学家的理论时，尽量说明出处
7. 鼓励用户深入思考，提供多角度的观点

请始终用中文回答。`

  // 构建消息历史
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt }
  ]

  // 添加历史消息
  history.forEach((msg) => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })
    }
  })

  // 添加当前用户消息
  let userContent = message
  if (image) {
    userContent += `\n[用户上传了图片]`
  }
  messages.push({ role: 'user', content: userContent })

  const API_URL = 'https://hunyuan.tencentcloudapi.com/'

  const timestamp = Math.floor(Date.now() / 1000)
  const requestBody = {
    Model: 'hunyuan-lite',
    Messages: messages.map(msg => ({
      Role: msg.role === 'assistant' ? 'Assistant' : msg.role === 'system' ? 'System' : 'User',
      Content: msg.content
    })),
    TopP: 0.7,
    Temperature: 0.7
  }

  const requestBodyStr = JSON.stringify(requestBody)

  console.log('请求URL:', API_URL)
  console.log('请求体:', requestBodyStr)

  const { authorization, headers } = generateTC3Signature(
    secretId,
    secretKey,
    'hunyuan',
    'ChatCompletions',
    requestBodyStr,
    timestamp
  )

  console.log('Authorization:', authorization.substring(0, 80) + '...')

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: headers,
    body: requestBodyStr
  })

  console.log('响应状态:', response.status, response.statusText)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('腾讯混元API错误响应:', errorText)
    throw new Error(`API请求失败: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  // 打印完整响应用于调试
  console.log('API响应:', JSON.stringify(data, null, 2))

  const reply = data.Response?.Choices?.[0]?.Message?.Content || '抱歉，我暂时无法回答这个问题。'

  console.log('提取的回复:', reply)

  res.json({
    success: true,
    reply,
    timestamp: new Date().toISOString()
  })
}
