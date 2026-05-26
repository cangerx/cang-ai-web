export interface ModelDisplayOption {
  id: string
  name?: string
}

const INTERNAL_MODEL_PATTERN = /^(gpt-image|dall-e|gemini|nano-banana|imagen|flux|sdxl|stable-diffusion|midjourney)[\w.-]*/i

export function getModelDisplayName(
  model?: string | null,
  models: ModelDisplayOption[] = [],
  fallback = ''
) {
  const value = String(model || '').trim()
  if (!value) return ''
  if (value === '*') return '全部'

  const matched = models.find((item) => item.id === value || item.name === value)
  if (matched) return matched.name || matched.id

  if (INTERNAL_MODEL_PATTERN.test(value)) return fallback

  return value
}
