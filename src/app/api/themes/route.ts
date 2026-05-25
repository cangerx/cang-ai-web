import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { listThemes, themes, DEFAULT_THEME_KEY } from '@/lib/theme/registry'
import { THEME_COOKIE } from '@/lib/theme/getActiveTheme'

/**
 * GET  /api/themes               → 列出已注册模板 + 当前激活 key
 * POST /api/themes { key: 'xxx' } → 切换模板（写 cookie）
 *
 * 后端 Filament 后台的"主题"下拉选项可以走 GET 拉取，
 * 用户/管理员的切换交互走 POST。
 */
export async function GET() {
  let active = DEFAULT_THEME_KEY
  try {
    const c = cookies().get(THEME_COOKIE)?.value
    if (c && themes[c]) active = c
  } catch {}

  return NextResponse.json({
    active,
    themes: listThemes(),
  })
}

export async function POST(request: Request) {
  let key = ''
  try {
    const body = await request.json()
    key = String(body?.key || '')
  } catch {}

  if (!key || !themes[key]) {
    return NextResponse.json({ ok: false, error: 'invalid theme key' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true, active: key })
  res.cookies.set(THEME_COOKIE, key, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })
  return res
}
