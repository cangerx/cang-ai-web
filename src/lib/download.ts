export function downloadImage(url?: string | null) {
  if (!url || typeof document === 'undefined') return

  const link = document.createElement('a')
  link.href = `/api/download?url=${encodeURIComponent(url)}`
  link.download = ''
  document.body.appendChild(link)
  link.click()
  link.remove()
}
