import api from './api'

export interface AgentSite {
  id: number
  name: string
  logo_url?: string
  theme_color?: string
  hero_title?: string
  hero_subtitle?: string
  hero_bg_url?: string
  hero_bg_color?: string
  announcement?: string
  invite_code?: string
}

let cachedSite: AgentSite | null = null

export async function fetchAgentSite(): Promise<AgentSite | null> {
  if (cachedSite) return cachedSite
  try {
    const host = typeof window !== 'undefined' ? window.location.host : ''
    const { data } = await api.get('/config', {
      headers: { 'X-Site-Host': host },
    })
    if (data.agent_site) {
      cachedSite = data.agent_site
      return cachedSite
    }
  } catch {
    // ignore
  }
  return null
}

export function applyAgentSiteTheme(site: AgentSite) {
  if (typeof document === 'undefined') return
  if (site.theme_color) {
    document.documentElement.style.setProperty('--accent', site.theme_color)
  }
}
