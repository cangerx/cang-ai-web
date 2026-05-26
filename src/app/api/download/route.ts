import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')
  const requestedFilename = searchParams.get('filename')

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  try {
    // 验证并防范 SSRF (Server-Side Request Forgery) 漏洞
    let parsedUrl: URL
    try {
      parsedUrl = new URL(imageUrl)
    } catch {
      return new NextResponse('Invalid URL format', { status: 400 })
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return new NextResponse('Invalid protocol. Only HTTP and HTTPS are allowed.', { status: 400 })
    }

    const hostname = parsedUrl.hostname.toLowerCase()
    const isPrivateHost = 
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)

    if (isPrivateHost) {
      return new NextResponse('Access to internal or loopback networks is forbidden', { status: 403 })
    }

    const response = await fetch(imageUrl, {
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        Accept: 'image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0',
      },
    })
    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    // Extract filename from URL
    let filename = requestedFilename || decodeURIComponent(parsedUrl.pathname.split('/').pop() || '') || 'image.png'
    filename = filename.replace(/[\\/:*?"<>|\r\n]+/g, '_')
    if (!filename.includes('.')) {
      const subtype = contentType.split(';')[0].split('/')[1] || 'png'
      const ext = subtype === 'jpeg' ? 'jpg' : subtype.replace('svg+xml', 'svg')
      filename = `${filename}.${ext}`
    }

    // Encoded filename for compatibility with HTTP headers (RFC 5987)
    const asciiFilename = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_') || 'image.png'
    const utf8Filename = encodeURIComponent(filename)
    const contentDisposition = `attachment; filename="${asciiFilename}"; filename*=UTF-8''${utf8Filename}`

    // Get binary data
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'Content-Length': String(buffer.length),
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: any) {
    console.error('Error proxying download:', error)
    return new NextResponse(`Error: ${error.message}`, { status: 500 })
  }
}
