import 'dotenv/config'

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

async function requestModel(prompt: string, systemContent: string, temperature: number, maxTokens = 4000) {
  const { url, key, name } = getModelConfig()

  if (!url || !key) {
    throw new Error('MODEL_API_URL or MODEL_API_KEY is missing')
  }

  let response: Response
  if (isAnthropicFormat(url)) {
    response = await fetchWithTimeout(
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
  } else {
    response = await fetchWithTimeout(
      url + '/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model: name,
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens
        })
      },
      120000
    )
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`AI request failed: ${response.status} ${text.slice(0, 200)}`)
  }

  return response.json()
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
  return data.choices?.[0]?.message?.content || ''
}

export const aiService = {
  async generateJson(prompt: string): Promise<string> {
    const { url } = getModelConfig()
    for (let attempt = 0; attempt < 2; attempt++) {
      const data = await requestModel(prompt, JSON_SYSTEM_PROMPT, 0.2, 2000)
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
    const data = await requestModel(prompt, CHAT_SYSTEM_PROMPT, 0.3, 4000)
    return isAnthropicFormat(url || '')
      ? extractAnthropicContent(data)
      : extractOpenAIContent(data)
  }
}
