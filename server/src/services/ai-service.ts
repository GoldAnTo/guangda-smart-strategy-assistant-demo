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
  return url.includes('anthropic')
}

// 5分钟超时
const AI_TIMEOUT_MS = 300000

function getProxyAgent() {
  // 优先使用环境变量，回退到本地代理
  const proxyUrl = process.env.MODEL_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY
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
        throw new Error(`AI 请求超时，请重试`)
      }
      throw err
    }
  } else {
    // OpenAI Chat Completions 格式（原生 fetch）
    return new Promise((resolve, reject) => {
      const messages: { role: string; content: string }[] = []
      if (systemContent) messages.push({ role: 'system', content: systemContent })
      messages.push({ role: 'user', content: prompt })

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

      fetch(`${url}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: name,
          messages,
          temperature,
          max_tokens: maxTokens
        }),
        signal: controller.signal as any
      }).then(res => {
        clearTimeout(timer)
        if (!res.ok) {
          res.text().then(t => reject(new Error(`AI request failed: ${res.status} ${t.slice(0, 200)}`)))
        } else {
          res.json().then(resolve).catch(e => reject(new Error(`Invalid JSON response: ${e.message}`)))
        }
      }).catch((err: any) => {
        clearTimeout(timer)
        if (err.name === 'AbortError' || String(err.message).includes('aborted')) {
          reject(new Error(`AI 请求超时，请重试`))
        } else {
          reject(err)
        }
      })
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
  // Responses API: { output: [{ type: 'message'|'reasoning'|'text', ... }] }
  // zxcode.vip 返回的 output 里第一个 block 可能是 reasoning/text，需要兼容所有类型
  if (data.output && Array.isArray(data.output)) {
    for (const block of data.output) {
      // 1. message block → content 数组里找 output_text / text
      if (block.type === 'message' && Array.isArray(block.content)) {
        const textBlock = block.content.find((b: any) => b.type === 'output_text' || b.type === 'text')
        if (textBlock?.text) return textBlock.text
      }
      // 2. reasoning block → summary_text
      if (block.type === 'reasoning' && block.summary_text) {
        return block.summary_text
      }
      // 3. 直接 text block
      if (block.type === 'text' && block.text) {
        return block.text
      }
    }
    // 兜底：遍历所有 block 的 content
    for (const block of data.output) {
      if (block.content && Array.isArray(block.content)) {
        const t = block.content.find((b: any) => b.type === 'output_text' || b.type === 'text')
        if (t?.text) return t.text
      }
    }
  }
  // 4. Responses API top-level text.raw（部分实现不走 output）
  if (data.text && typeof data.text === 'object') {
    if (data.text.raw) return data.text.raw
    if (data.text.content) return data.text.content
  }
  // 5. Chat Completions 兼容
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
    console.log('[generateText] raw response:', JSON.stringify(data).slice(0, 500))
    return isAnthropicFormat(url || '')
      ? extractAnthropicContent(data)
      : extractOpenAIContent(data)
  }
}
