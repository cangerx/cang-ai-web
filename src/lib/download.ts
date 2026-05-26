export async function downloadImage(url?: string | null) {
  if (!url || typeof window === 'undefined') return

  let fallbackFilename = url.split('/').pop()?.split('?')[0] || 'image.png'
  const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(fallbackFilename)}&_=${Date.now()}`

  try {
    // 尝试通过 Fetch 直接获取图片 Blob，避免跳转并支持重命名
    const response = await fetch(proxyUrl, { cache: 'no-store' })
    if (!response.ok) throw new Error(`Fetch status: ${response.status}`)
    
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    
    // 尽量从 url 提取文件名
    let filename = fallbackFilename
    if (!filename.includes('.')) {
      const ext = blob.type.split('/')[1] || 'png'
      filename = `${filename}.${ext}`
    }

    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()

    // 释放 blob URL
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
  } catch (error) {
    console.warn('Direct fetch download failed, falling back to Next.js API proxy...', error)
    
    // 降级使用本地 Next.js API 代理下载
    const link = document.createElement('a')
    link.href = proxyUrl
    
    let filename = fallbackFilename
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
}

