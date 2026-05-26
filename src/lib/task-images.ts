interface ImageRecord {
  url?: string | null
  image_url?: string | null
  imageUrl?: string | null
  thumb?: string | null
}

interface TaskImageSource {
  items?: unknown
  images?: unknown
  image_url?: string | null
  thumb?: string | null
}

function readImageUrl(value: unknown) {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return ''

  const item = value as ImageRecord
  return item.url || item.image_url || item.imageUrl || item.thumb || ''
}

export function getTaskImageUrls(task?: TaskImageSource | null) {
  if (!task) return []

  const urls = [
    ...(Array.isArray(task.items) ? task.items.map(readImageUrl) : []),
    ...(Array.isArray(task.images) ? task.images.map(readImageUrl) : []),
    readImageUrl(task.image_url),
    readImageUrl(task.thumb),
  ]

  return Array.from(new Set(urls.filter(Boolean)))
}
