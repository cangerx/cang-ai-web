import { cookies, headers } from 'next/headers'
import { DEFAULT_THEME_KEY, themes } from './registry'

export const THEME_COOKIE = 'cang_theme'
export const THEME_QUERY = 'theme'

/**
 * 服务端：读取当前激活的模板 key
 *
 * 优先级（高 → 低）：
 *   1. URL ?theme=xxx（仅作预览，通过中间件写入 cookie 持久化）
 *   2. cookie `cang_theme`（用户/管理员显式切换）
 *   3. 环境变量 NEXT_PUBLIC_DEFAULT_THEME（站点默认）
 *   4. registry 中的 DEFAULT_THEME_KEY
 *
 * TODO: 接入后端 SiteSetting.active_theme 后，可以在第 3 步前插一步
 *       fetch('/api/site/theme') 拉取站点全局默认。
 */
export async function getActiveThemeKey(): Promise<string> {
  try {
    const c = cookies().get(THEME_COOKIE)?.value
    if (c && themes[c]) return c
  } catch {
    // cookies() 可能在非请求上下文里抛错
  }

  try {
    const h = headers()
    const url = h.get('x-invoke-path') || ''
    if (url) {
      // 兜底：从 referer 解析（仅当中间件未写 cookie 的极端情况）
    }
  } catch {}

  const envDefault = process.env.NEXT_PUBLIC_DEFAULT_THEME
  if (envDefault && themes[envDefault]) return envDefault

  return DEFAULT_THEME_KEY
}
