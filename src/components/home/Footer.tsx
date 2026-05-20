'use client'

import { useSiteStore } from '@/stores/site'

export function Footer() {
  const { config } = useSiteStore()
  const siteName = config?.site_name || 'CANG-AI'

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-divider" />
        <div className="footer-brand">
          <span className="footer-logo">{siteName.charAt(0).toUpperCase()}</span>
          <span className="footer-brand-text">{siteName}</span>
        </div>
        <div className="footer-links">
          <a href="mailto:support@cang-ai.com">联系我们</a>
          <span className="dot">&middot;</span>
          <a href="/terms" target="_blank">服务条款</a>
          <span className="dot">&middot;</span>
          <a href="/privacy" target="_blank">隐私政策</a>
          {config?.footer_links?.map((link, i) => (
            <span key={i}>
              <span className="dot">&middot;</span>
              <a href={link.url} target="_blank" rel="noopener">{link.label}</a>
            </span>
          ))}
        </div>
        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} {siteName} &middot; AI智能绘画平台 &middot; All rights reserved
          {config?.footer_icp && <span> &middot; {config.footer_icp}</span>}
        </div>
        {config?.footer_text && (
          <div style={{ marginTop: 6, color: '#c4c4c8', fontSize: 11 }}>{config.footer_text}</div>
        )}
      </div>
    </footer>
  )
}
