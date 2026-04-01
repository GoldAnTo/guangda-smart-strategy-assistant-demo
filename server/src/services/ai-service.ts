import 'dotenv/config'
import axios from 'axios'

function getModelConfig() {
  return {
    url: process.env.MODEL_API_URL,
    key: process.env.MODEL_API_KEY,
    name: process.env.MODEL_NAME || 'gpt-5.4'
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 120000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timer)
    return response
  } catch (err: any) {
    clearTimeout(timer)
    if (err.name === 'AbortError' || String(err.message).includes('aborted')) {
      throw new Error(`请求超时（${timeoutMs / 1000}s），请重试`)
    }
    throw err
  }
}

function isAnthropicFormat(url: string): boolean {
  return url.includes('anthropic') || url.includes('minimaxi')
}

// axios 实例（支持代理），用于 OpenAI 格式请求
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || ''
function buildAxiosInstance() {
  if (!proxyUrl) return axios.create({ timeout: 120000 })
  try {
    const u = new URL(proxyUrl)
    return axios.create({
      timeout: 120000,
      proxy: {
        host: u.hostname,
        port: parseInt(u.port || '7897'),
        protocol: u.protocol.replace(':', '')
      }
    })
  } catch {
    return axios.create({ timeout: 120000 })
  }
}
const axiosInstance = buildAxiosInstance()

async function requestModel(prompt: string, systemContent: string, temperature: number, maxTokens = 4000) {
  const { url, key, name } = getModelConfig()

  if (!url || !key) {
    throw new Error('MODEL_API_URL or MODEL_API_KEY is missing')
  }

  if (isAnthropicFormat(url)) {
    // Anthropic/MiniMax 格式（原生 fetch，无需代理）
    const response = await fetchWithTimeout(
      url + '/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: name,
          system: systemContent,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens
        })
      },
      120000
    )
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`AI request failed: ${response.status} ${text.slice(0, 200)}`)
    }
    return response.json()
  } else {
    // OpenAI Responses API 格式（axios + 代理）
    const response = await axiosInstance.post(
      url + '/v1/responses',
      {
        model: name,
        input: (systemContent ? systemContent + '\n\n' : '') + prompt,
        max_tokens: maxTokens
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`
        }
      }
    )
    return response.data
  }
}

const JSON_SYSTEM_PROMPT = 'You must output valid JSON only. Do not include markdown fences or extra commentary.'

const CHAT_SYSTEM_PROMPT = `
你是一名资管产品与策略沟通助手。你必须始终遵守以下规则：
- 你不是最终投顾决策人
- 你不能承诺收益或保本
- 你不能使用绝对化、误导性或过度营销的话术
- 你的回答必须详尽、深入、有洞察，不要泛泛而谈
- 如果信息不足，你优先补问，而不是强行下结论
你的回答风格：专业但通俗，详尽有深度，先解释再给方向。
`.trim()

function extractAnthropicContent(data: any): string {
  const blocks = data.content || []
  return blocks
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('')
}

function extractOpenAIContent(data: any): string {
  // Responses API 格式
  if (data.output) return data.output
  // Chat Completions 兼容
  return data.choices?.[0]?.message?.content || ''
}

export const aiService = {
  async generateJson(prompt: string): Promise<string> {
    const { url } = getModelConfig()
    for (let attempt = 0; attempt < 2; attempt++) {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI请求超时（10s）')), 10000)
      )
      const requestPromise = requestModel(prompt, JSON_SYSTEM_PROMPT, 0.2, 2000)
      const data = await Promise.race([requestPromise, timeoutPromise])
      const content = isAnthropicFormat(url || '')
        ? extractAnthropicContent(data)
        : extractOpenAIContent(data)
      try {
        JSON.parse(content)
        return content
      } catch {
        if (attempt === 1) {
          throw new Error('AI JSON response is invalid after retry')
        }
      }
    }
    return '{}'
  },

  async generateText(prompt: string): Promise<string> {
    const { url } = getModelConfig()
    // 硬超时10秒，防止代理无限等待
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI请求超时（10s），请重试')), 10000)
    )
    const requestPromise = requestModel(prompt, CHAT_SYSTEM_PROMPT, 0.3, 4000)
    const data = await Promise.race([requestPromise, timeoutPromise])
    return isAnthropicFormat(url || '')
      ? extractAnthropicContent(data)
      : extractOpenAIContent(data)
  }
}
