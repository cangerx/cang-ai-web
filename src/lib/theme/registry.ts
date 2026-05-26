import defaultTheme from '@/themes/default/theme.config'
import chatgptLikeTheme from '@/themes/chatgpt-like/theme.config'
import ghiblioTheme from '@/themes/ghiblio/theme.config'
import type { ThemeDefinition, ThemeSummary } from './types'

/**
 * 全部已注册模板。
 *
 * 新增一套模板的步骤：
 *   1. 在 src/themes/<key>/ 下实现 theme.config.ts
 *   2. 在本文件 import 并加入 themes 字典
 *   3. 在后台 SiteSettings.active_theme 下拉里就会自动出现
 *
 * 注意：必须用静态 import，不要用动态字符串 import，否则 Next.js
 * 静态分析无法 tree-shake，且 SSR 会出现解析问题。
 */
export const themes: Record<string, ThemeDefinition> = {
  [defaultTheme.key]: defaultTheme,
  [chatgptLikeTheme.key]: chatgptLikeTheme,
  [ghiblioTheme.key]: ghiblioTheme,
}

export const DEFAULT_THEME_KEY = defaultTheme.key

export function getTheme(key?: string | null): ThemeDefinition {
  if (key && themes[key]) return themes[key]
  return themes[DEFAULT_THEME_KEY]
}

export function listThemes(): ThemeSummary[] {
  return Object.values(themes).map((t) => ({
    key: t.key,
    name: t.name,
    description: t.description,
    preview: t.preview,
    features: t.features ?? Object.keys(t.pages),
  }))
}
