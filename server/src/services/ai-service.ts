function getModelConfig() {
  return {
    url: process.env.MODEL_API_URL,
    key: process.env.MODEL_API_KEY,
    name: process.env.MODEL_NAME || 'gpt-5.4'
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    })
  } finally {
    clearTimeout(timer)
  }
}

async function requestModel(prompt: string, systemContent: string, temperature: number) {
  const { url, key, name } = getModelConfig()

  if (!url || !key) {
    throw new Error('MODEL_API_URL or MODEL_API_KEY is missing')
  }

  const response = await fetchWithTimeout(
    url,
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
        temperature
      })
    },
    30000
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`AI request failed: ${response.status} ${text}`)
  }

  return response.json()
}

const JSON_SYSTEM_PROMPT = 'You must output valid JSON only. Do not include markdown fences or extra commentary.'

const CHAT_SYSTEM_PROMPT = `
你是一名资管产品与策略沟通助手。

你必须始终遵守以下规则：
- 你不是最终投顾决策人
- 你不能承诺收益或保本
- 你不能使用绝对化、误导性或过度营销的话术
- 你只能围绕给定上下文中的产品、策略、客户偏好与风险提示回答
- 如果信息不足，你优先补问，而不是强行下结论
- 如果问题涉及正式销售判断、敏感争议或超出上下文，明确提示建议进一步人工沟通确认

你的回答风格：
- 专业但通俗
- 简洁、克制、自然
- 先解释，再给方向
- 不要堆术语，不要写成官话或营销文案
`.trim()

export const aiService = {
  async generateJson(prompt: string): Promise<string> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const data = await requestModel(prompt, JSON_SYSTEM_PROMPT, 0.2)
      const content = data.choices?.[0]?.message?.content || '{}'

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
    const data = await requestModel(prompt, CHAT_SYSTEM_PROMPT, 0.2)
    return data.choices?.[0]?.message?.content || ''
  }
}
