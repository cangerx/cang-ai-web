import type { ThemeDefinition } from '@/lib/theme/types'
import HomePage from './pages/HomePage'

/**
 * chatgpt-like 模板：左侧栏 + 中央对话式
 *
 * 仅覆盖 home 页；其他页面（pricing/explore/...）由调度器自动 fallback
 * 到 default 模板，避免重复造轮子。当你想做差异化时再在本目录补对应 page。
 */
const theme: ThemeDefinition = {
  key: 'chatgpt-like',
  name: 'ChatGPT 风模板',
  description: '左侧栏 + 居中对话式生成区，适合简洁聊天感场景。',
  pages: {
    home: HomePage,
  },
  features: ['home'],
  tokens: {
    // 主色稍偏绿，与 ChatGPT 视觉接近，但你也可以保留蓝色
    accent: '#10a37f',
    'accent-soft': 'rgba(16, 163, 127, 0.10)',
    'accent-glow': 'rgba(16, 163, 127, 0.20)',
  },
}

export default theme
