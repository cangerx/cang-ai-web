/**
 * 把模板私有 CSS 变量注入 :root
 *
 * 服务端渲染为内联 <style>，避免客户端切换闪烁。
 * 因为同名变量会覆盖 globals.css 中的默认值，模板可以按需覆盖
 * --accent / --bg / --radius 等。
 */
export function ThemeTokens({ tokens }: { tokens?: Record<string, string> }) {
  if (!tokens || Object.keys(tokens).length === 0) return null
  const css = Object.entries(tokens)
    .map(([k, v]) => `--${k.replace(/^--/, '')}:${v};`)
    .join('')
  return <style>{`:root{${css}}`}</style>
}
