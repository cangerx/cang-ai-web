import api from '@/lib/api'

/** 上传限制 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const COMPRESS_THRESHOLD = 2 * 1024 * 1024 // 超过 2MB 自动压缩
const COMPRESS_MAX_WIDTH = 2048
const COMPRESS_QUALITY = 0.85

/** 校验文件大小 */
export function validateFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return '请选择图片文件'
  if (file.size > MAX_FILE_SIZE) return `图片不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB`
  return null
}

/** 前端图片压缩：Canvas 缩放 + quality */
export function compressImage(file: File, maxWidth = COMPRESS_MAX_WIDTH, quality = COMPRESS_QUALITY): Promise<File> {
  return new Promise((resolve, reject) => {
    // 小于阈值不压缩
    if (file.size <= COMPRESS_THRESHOLD) {
      resolve(file)
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width))
        width = maxWidth
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('压缩失败'))
          const compressed = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(compressed)
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file) // 压缩失败用原图
    }
    img.src = url
  })
}

/** 上传图片：优先 OSS 直传，降级后端中转 */
export async function uploadImage(file: File): Promise<string> {
  // 1. 压缩
  const compressed = await compressImage(file)

  // 2. 尝试获取预签名（OSS 直传）
  try {
    const { data: presign } = await api.post('/upload-presign', {
      mime_type: compressed.type || 'image/jpeg',
    })

    if (presign.direct) {
      // 直传 OSS
      await fetch(presign.url, {
        method: presign.method || 'PUT',
        headers: presign.headers || { 'Content-Type': compressed.type },
        body: compressed,
      })
      return presign.final_url
    }
  } catch {
    // 预签名失败，降级到后端中转
  }

  // 3. 后端中转上传
  const formData = new FormData()
  formData.append('image', compressed)
  const { data } = await api.post('/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}
