import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 将当前 Host 传递给 API 请求，后端用于识别分站
  // 必须通过 request.headers 设置并传入 NextResponse.next({ request: { headers } })，
  // 否则 Next.js 在进行 rewrites 代理时，后端将无法接收到该请求头（原写法设置在 response.headers 上只能发回给浏览器）。
  const host = request.headers.get('host') || ''
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-forwarded-host', host)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
