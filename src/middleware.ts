import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const THEME_COOKIE = 'cang_theme'
const THEME_QUERY = 'theme'
// 与 src/lib/theme/registry.ts 保持同步。Edge runtime 不便 import 完整 registry，
// 这里维护一份纯字符串白名单，新增模板时记得同步加入。
const ALLOWED_THEMES = new Set<string>(['default', 'chatgpt-like'])

export function middleware(request: NextRequest) {
  // 将当前 Host 传递给 API 请求，后端用于识别分站
  // 必须通过 request.headers 设置并传入 NextResponse.next({ request: { headers } })，
  // 否则 Next.js 在进行 rewrites 代理时，后端将无法接收到该请求头（原写法设置在 response.headers 上只能发回给浏览器）。
  const host = request.headers.get('host') || ''
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-forwarded-host', host)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // 主题预览：?theme=xxx → 持久化到 cookie，让后续 SSR 直接命中
  const queryTheme = request.nextUrl.searchParams.get(THEME_QUERY)
  if (queryTheme && ALLOWED_THEMES.has(queryTheme)) {
    response.cookies.set(THEME_COOKIE, queryTheme, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 年
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
