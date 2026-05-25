# 多主题模板系统

类 WordPress 主题机制：每套模板独立一个目录，后台/cookie 切换决定运行时渲染哪套。

## 目录结构

```
src/
├── lib/theme/
│   ├── types.ts              ThemeDefinition 接口
│   ├── registry.ts           所有模板注册中心（静态 import）
│   ├── getActiveTheme.ts     服务端读取当前激活模板 key
│   ├── ThemeTokens.tsx       注入模板私有 CSS 变量到 :root
│   └── renderThemePage.tsx   调度器：根据当前主题渲染对应业务页面
├── themes/
│   ├── default/              默认模板
│   │   ├── theme.config.ts
│   │   └── pages/*.tsx
│   └── chatgpt-like/         示例第二主题
│       ├── theme.config.ts
│       ├── pages/HomePage.tsx
│       └── styles/main.css
└── app/<route>/page.tsx      路由层薄壳（3 行）：renderThemePage('<key>')
```

## 工作流程

1. 用户访问 `/pricing`
2. `src/app/pricing/page.tsx` 调用 `renderThemePage('pricing')`
3. 调度器读 cookie `cang_theme` 拿当前主题 key
4. 查 `registry.themes[key].pages['pricing']` 拿到组件
5. 找不到则 fallback 到 `default` 模板的同 key 页
6. 仍找不到 → 404

## 新增一套主题

```bash
mkdir -p src/themes/my-theme/pages
mkdir -p src/themes/my-theme/styles
```

1. **创建 `theme.config.ts`**

```ts
import type { ThemeDefinition } from '@/lib/theme/types'
import HomePage from './pages/HomePage'

const theme: ThemeDefinition = {
  key: 'my-theme',
  name: '我的模板',
  pages: { home: HomePage },   // 只覆盖 home，其他 fallback 到 default
  features: ['home'],
  tokens: {
    accent: '#ff6b6b',         // 覆盖 :root --accent
  },
}
export default theme
```

2. **注册到 `src/lib/theme/registry.ts`**：import + 加入 `themes` 字典
3. **加入 `src/middleware.ts` 的 `ALLOWED_THEMES`** 白名单（Edge runtime 不便完整 import registry）
4. **页面组件**正常写，可以 `import '@/components/...'` 复用业务组件

## 切换主题

| 方式 | 用途 |
|---|---|
| 浏览器访问 `/?theme=chatgpt-like` | 预览，自动写 cookie 持久化 |
| `POST /api/themes` body `{key:'xxx'}` | 应用内切换 |
| `GET /api/themes` | 列出已注册模板 + 当前 active |
| 设置 cookie `cang_theme=xxx` | 直接持久化（中间件/后端都可 set） |
| `NEXT_PUBLIC_DEFAULT_THEME=xxx` | 站点默认（无 cookie 时） |

## 设计原则

- **业务组件共享**：`src/components/`、`src/stores/`、`src/lib/` 不属于任何模板。模板只重新组合它们
- **静态 import**：必须用 `import` 字符串字面量，不要用动态 `import(pathVar)`，Next.js 静态分析无法 tree-shake
- **页面级 fallback**：新主题可只覆盖关心的页面，其他 fallback 到 default，避免重复造轮子
- **CSS 私有化**：模板私有 CSS 放 `styles/`，在 client 组件顶部 `import './styles/main.css'`，Next.js 自动打到该路由 chunk
- **CSS 变量优先**：通过 `tokens` 覆盖 `globals.css` 中的 `:root` 变量（颜色、圆角、阴影），比改 class 名更轻量

## 已知权衡

- **First Load JS 偏大**：所有 client pages 通过 `theme.config.ts` 静态 import 聚合到同一个共享 chunk（多主题架构的固有成本）。若在意，可改为 `React.lazy` + Suspense 按需拆分，但 SSR 调度复杂度上升
- **Middleware 白名单需手动维护**：Edge runtime 无法 import 完整 registry。新增主题记得在两处同步：`registry.ts` + `middleware.ts`

## 待办（后端侧）

- `SiteSetting.active_theme` 字段（站点全局默认主题）
- Filament 后台一个 `Select` 字段，options 走 `GET /api/themes`
- 前端在没有 cookie 时，从后端 `/api/site/theme` 取站点默认
