import { renderThemePage } from '@/lib/theme/renderThemePage'

/**
 * 路由层薄壳：把渲染交给当前激活的模板（见 src/lib/theme/registry.ts）
 *
 * 添加新主题：
 *   - 在 src/themes/<key>/ 实现并注册到 registry
 *   - 后台 SiteSetting.active_theme（或 cookie cang_theme）切换即可生效
 *
 * 不要在这里写业务代码 —— 业务全部下沉到 src/themes/<key>/pages/HomePage.tsx
 */
export default async function Page() {
  return renderThemePage('home')
}
