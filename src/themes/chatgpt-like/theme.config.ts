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
    bg: '#0b0b0c',
    'bg-secondary': '#111113',
    panel: 'rgba(23, 23, 26, 0.75)',
    'panel-strong': 'rgba(28, 28, 32, 0.95)',
    line: 'rgba(255, 255, 255, 0.05)',
    'line-strong': 'rgba(255, 255, 255, 0.1)',
    text: '#ececf1',
    'text-primary': '#ffffff',
    'text-secondary': '#a1a1aa',
    'text-tertiary': '#71717a',
    muted: '#71717a',
    'muted-soft': '#52525b',
    accent: '#10a37f',
    'accent-soft': 'rgba(16, 163, 127, 0.12)',
    'accent-glow': 'rgba(16, 163, 127, 0.22)',
    black: '#000000',
    shadow: '0 24px 64px -12px rgba(0, 0, 0, 0.65)',
    'shadow-soft': '0 8px 32px -8px rgba(0, 0, 0, 0.45)',
    glass: 'saturate(1.8) blur(24px)',
  },
}

export default theme
