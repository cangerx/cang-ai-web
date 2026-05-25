import { cookies } from 'next/headers'
import { DEFAULT_THEME_KEY, themes } from './registry'

export const THEME_COOKIE = 'cang_theme'
export const THEME_QUERY = 'theme'

/**
 * 服务端：读取当前激活的模板 key
 *
 * 优先级（高 → 低）：
 *   1. cookie `cang_theme`（中间件根据 ?theme= 自动写入；或 POST /api/themes 切换）
 *   2. 后端站点默认 `/api/site/theme`（管理员在 Filament「站点设置 → 前端主题」配置）
 *   3. 环境变量 NEXT_PUBLIC_DEFAULT_THEME
 *   4. registry 中的 DEFAULT_THEME_KEY（'default'）
 */
export async function getActiveThemeKey(): Promise<string> {
  try {
    const c = cookies().get(THEME_COOKIE)?.value
    if (c && themes[c]) return c
  } catch {
    // cookies() 可能在非请求上下文里抛错
  }

  const remote = await fetchRemoteDefault()
  if (remote && themes[remote]) return remote

  const envDefault = process.env.NEXT_PUBLIC_DEFAULT_THEME
  if (envDefault && themes[envDefault]) return envDefault

  return DEFAULT_THEME_KEY
}

/**
 * 调后端 /api/site/theme 拿管理员配置的默认模板。
 * 静默失败：网络/接口异常都返回 null，由调用方走下一级回退。
 *
 * 优先用服务端 API_URL（容器内直连），其次 NEXT_PUBLIC_API_URL。
 * 缓存 60s，避免每次 SSR 都打后端。
 */
async function fetchRemoteDefault(): Promise<string | null> {
  const base =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1'
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/site/theme`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { active?: string }
    return typeof data?.active === 'string' ? data.active : null
  } catch {
    return null
  }
}
