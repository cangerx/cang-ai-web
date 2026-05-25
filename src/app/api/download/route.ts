import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    // Extract filename from URL
    let filename = imageUrl.split('/').pop()?.split('?')[0] || 'image.png'
    if (!filename.includes('.')) {
      const ext = contentType.split('/')[1] || 'png'
      filename = `${filename}.${ext}`
    }

    // Encoded filename for compatibility with HTTP headers (RFC 5987)
    const utf8Filename = encodeURIComponent(filename)
    const contentDisposition = `attachment; filename="${utf8Filename}"; filename*=UTF-8''${utf8Filename}`

    // Get binary data
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    console.error('Error proxying download:', error)
    return new NextResponse(`Error: ${error.message}`, { status: 500 })
  }
}
