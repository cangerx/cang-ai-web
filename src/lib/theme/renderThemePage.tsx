import { notFound } from 'next/navigation'
import { getActiveThemeKey } from './getActiveTheme'
import { getTheme } from './registry'
import { ThemeTokens } from './ThemeTokens'

/**
 * 服务端调度器：根据当前激活模板渲染对应业务页面
 *
 * 用法（在 app/ 路由文件里）：
 *   export default async function Page() {
 *     return renderThemePage('home')
 *   }
 *
 * 若当前模板未提供该 pageKey，则回退到 default 模板的同 key 页面，
 * 仍不存在才 404。这样允许新模板只覆盖部分页面、其余复用默认。
 */
export async function renderThemePage(pageKey: string) {
  const themeKey = await getActiveThemeKey()
  const theme = getTheme(themeKey)

  let Page = theme.pages[pageKey]
  if (!Page) {
    const fallback = getTheme(null) // default
    Page = fallback.pages[pageKey]
  }
  if (!Page) notFound()

  return (
    <div className={`theme-viewport theme-${themeKey}-wrapper`}>
      <ThemeTokens tokens={theme.tokens} />
      <Page />
    </div>
  )
}
