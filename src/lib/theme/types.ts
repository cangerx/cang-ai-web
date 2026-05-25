import type { ComponentType } from 'react'

/**
 * 模板定义
 *
 * 每套模板对应一个 ThemeDefinition，注册到 src/lib/theme/registry.ts。
 * pages 的 key 是「业务页面名」（如 home/explore/pricing），由 app/ 路由通过
 * renderThemePage(pageKey) 调度到当前激活模板的对应组件。
 */
export interface ThemeDefinition {
  /** 模板唯一标识，建议小写连字符 */
  key: string
  /** 后台展示名 */
  name: string
  /** 后台描述 */
  description?: string
  /** 预览图（public/ 下的路径） */
  preview?: string
  /** 业务页面 -> 组件映射 */
  pages: Record<string, ComponentType<any>>
  /** 模板支持的页面 key 列表，缺省时用 Object.keys(pages) */
  features?: string[]
  /** 模板私有 CSS 变量，会在 <html> 上注入为 :root 变量 */
  tokens?: Record<string, string>
}

export interface ThemeSummary {
  key: string
  name: string
  description?: string
  preview?: string
  features: string[]
}
