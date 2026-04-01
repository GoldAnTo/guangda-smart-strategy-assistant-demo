import 'dotenv/config'
import * as https from 'https'
import { HttpsProxyAgent } from 'https-proxy-agent'

function getModelConfig() {
  return {
    url: process.env.MODEL_API_URL,
    key: process.env.MODEL_API_KEY,
    name: process.env.MODEL_NAME || 'gpt-5.4'
  }
}

function isAnthropicFormat(url: string): boolean {
  return url.includes('anthropic') || url.includes('minimaxi')
}

// 5分钟超时
const AI_TIMEOUT_MS = 300000

function getProxyAgent() {
  // 优先使用环境变量，回退到本地代理
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://127.0.0.1:7897'
  if (!proxyUrl) return undefined
  try {
    return new HttpsProxyAgent(proxyUrl)
  } catch { return undefined }
}

async function requestModel(prompt: string, systemContent: string, temperature: number, maxTokens = 4000) {
  const { url, key, name } = getModelConfig()
  if (!url || !key) throw new Error('MODEL_API_URL or MODEL_API_KEY is missing')

  const proxyAgent = getProxyAgent()

  if (isAnthropicFormat(url)) {
    // Anthropic/MiniMax 格式
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)
    try {
      const response = await fetch(url + '/messages', {
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
        }),
        signal: controller.signal as any
      } as any)
      clearTimeout(timer)
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`AI request failed: ${response.status} ${text.slice(0, 200)}`)
      }
      return response.json()
    } catch (err: any) {
      clearTimeout(timer)
      if (err.name === 'AbortError' || String(err.message).includes('aborted')) {
        throw new Error(`AI 请求超时（${AI_TIMEOUT_MS / 1000}s），请重试`)
      }
      throw err
    }
  } else {
    // OpenAI Responses API 格式（通过代理）
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        model: name,
        input: (systemContent ? systemContent + '\n\n' : '') + prompt,
        max_tokens: maxTokens
      })

      const options: https.RequestOptions = {
        hostname: new URL(url).hostname,
        port: 443,
        path: '/v1/responses',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: AI_TIMEOUT_MS
      }

      if (proxyAgent) {
        (options as any).agent = proxyAgent
      }

      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`AI request failed: ${res.statusCode} ${data.slice(0, 200)}`))
          } else {
            try { resolve(JSON.parse(data)) }
            catch { reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`)) }
          }
        })
      })

      req.on('error', (err) => reject(err))
      req.on('timeout', () => { req.destroy(); reject(new Error(`AI 请求超时（${AI_TIMEOUT_MS / 1000}s），请重试`)) })

      req.write(body)
      req.end()
    })
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
  return blocks.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
}

function extractOpenAIContent(data: any): string {
  // Responses API: { output: [{ type: 'message', content: [{ type: 'output_text', text: '...' }] }] }
  if (data.output && Array.isArray(data.output)) {
    const messageBlock = data.output.find((b: any) => b.type === 'message')
    if (messageBlock?.content && Array.isArray(messageBlock.content)) {
      const textBlock = messageBlock.content.find((b: any) => b.type === 'output_text' || b.type === 'text')
      if (textBlock?.text) return textBlock.text
    }
  }
  // Chat Completions 兼容
  return data.choices?.[0]?.message?.content || ''
}

export const aiService = {
  async generateJson(prompt: string): Promise<string> {
    const { url } = getModelConfig()
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const data = await requestModel(prompt, JSON_SYSTEM_PROMPT, 0.2, 2000)
        const content = isAnthropicFormat(url || '')
          ? extractAnthropicContent(data)
          : extractOpenAIContent(data)
        JSON.parse(content)
        return content
      } catch (err: any) {
        if (attempt === 1) throw new Error('AI JSON response is invalid after retry: ' + err.message)
      }
    }
    return '{}'
  },

  async generateText(prompt: string): Promise<string> {
    const { url } = getModelConfig()
    const data = await requestModel(prompt, CHAT_SYSTEM_PROMPT, 0.3, 4000)
    return isAnthropicFormat(url || '')
      ? extractAnthropicContent(data)
      : extractOpenAIContent(data)
  }
}
