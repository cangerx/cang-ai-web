import type { ThemeDefinition } from '@/lib/theme/types'
import HomePage from './pages/HomePage'
import TemplatesPage from './pages/TemplatesPage'

const theme: ThemeDefinition = {
  key: 'ghiblio',
  name: 'Ghiblio 手绘主题',
  description: '温暖手绘感首页，突出 AI 艺术创作、作品社区和轻量工作台。',
  pages: {
    home: HomePage,
    templates: TemplatesPage,
  },
  features: ['home', 'templates'],
  tokens: {
    bg: '#fbf0d8',
    'bg-secondary': '#fff8ea',
    panel: 'rgba(255, 252, 242, 0.78)',
    'panel-strong': 'rgba(255, 252, 242, 0.94)',
    line: 'rgba(99, 74, 45, 0.12)',
    'line-strong': 'rgba(99, 74, 45, 0.20)',
    text: '#332719',
    'text-primary': '#332719',
    'text-secondary': '#7a6346',
    'text-tertiary': '#a48a66',
    muted: '#7a6346',
    'muted-soft': '#b89c75',
    accent: '#d97732',
    'accent-soft': 'rgba(217, 119, 50, 0.14)',
    'accent-glow': 'rgba(217, 119, 50, 0.26)',
    warm: '#e9a23b',
    black: '#2c2116',
    shadow: '0 28px 70px -24px rgba(76, 51, 24, 0.34)',
    'shadow-soft': '0 16px 44px -24px rgba(76, 51, 24, 0.28)',
  },
}

export default theme
