import { create } from 'zustand'
import api from '@/lib/api'

export interface SiteConfig {
  site_name: string
  site_description?: string
  site_keywords?: string
  announcement: string
  prompt_tool_model: string
  reverse_prompt_model: string
  cost_per_generation: number
  billing_rules: Array<{ app: string; model: string; quality: string; credits: number }>
  announcements: string[]
  models: Array<{ id: string; name: string; sizes?: string[]; qualities?: string[] }>
  login_methods: { github: boolean; wechat: boolean }
  footer_text?: string
  footer_icp?: string
  footer_links?: Array<{ label: string; url: string }>
  hero_title?: string
  hero_subtitle?: string
}

interface SiteState {
  config: SiteConfig | null
  loading: boolean
  fetchConfig: () => Promise<void>
}

export const useSiteStore = create<SiteState>((set) => ({
  config: null,
  loading: false,

  fetchConfig: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get('/config')
      set({ config: data, loading: false })
    } catch {
      set({ loading: false })
    }
  },
}))
