import type { ThemeDefinition } from '@/lib/theme/types'
import HomePage from './pages/HomePage'
import DistributionPage from './pages/DistributionPage'
import ExplorePage from './pages/ExplorePage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import LoginPage from './pages/LoginPage'
import PricingPage from './pages/PricingPage'
import PrivacyPage from './pages/PrivacyPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import TasksPage from './pages/TasksPage'
import TemplatesPage from './pages/TemplatesPage'
import TermsPage from './pages/TermsPage'

/**
 * 默认模板（迁移自原 src/app 下的页面）。
 *
 * 新增页面时：
 *   1. 在 ./pages/XxxPage.tsx 实现
 *   2. 在 pages 字典里登记 key（与 app/<route>/page.tsx 中的 renderThemePage('<key>') 一致）
 *   3. 把 key 加入 features
 */
const theme: ThemeDefinition = {
  key: 'default',
  name: '默认模板',
  description: 'Visionary AI 经典布局：英雄区 + 生成区 + 画廊。',
  pages: {
    home: HomePage,
    distribution: DistributionPage,
    explore: ExplorePage,
    'forgot-password': ForgotPasswordPage,
    login: LoginPage,
    pricing: PricingPage,
    privacy: PrivacyPage,
    profile: ProfilePage,
    register: RegisterPage,
    tasks: TasksPage,
    templates: TemplatesPage,
    terms: TermsPage,
  },
  features: [
    'home',
    'distribution',
    'explore',
    'forgot-password',
    'login',
    'pricing',
    'privacy',
    'profile',
    'register',
    'tasks',
    'templates',
    'terms',
  ],
  tokens: {
    // 默认模板不覆盖任何变量，保留 globals.css 中的值
  },
}

export default theme
