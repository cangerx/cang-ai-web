import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // 将当前 Host 传递给 API 请求，后端用于识别分站
  const host = request.headers.get('host') || ''
  response.headers.set('x-forwarded-host', host)

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
