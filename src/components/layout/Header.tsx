'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores/auth'
import { useSiteStore } from '@/stores/site'
import { useEffect } from 'react'
import { User, LogOut, Sparkles } from 'lucide-react'

export function Header() {
  const { user, logout } = useAuthStore()
  const { config, fetchConfig } = useSiteStore()

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-black/5">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="min-w-0 flex items-center gap-2 font-bold text-base sm:text-lg text-gray-900">
          <Sparkles className="w-5 h-5 text-accent flex-shrink-0" />
          <span className="truncate">{config?.site_name || 'Visionary AI'}</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <Link href="/explore" className="hidden sm:inline text-sm text-gray-600 hover:text-gray-900 transition-colors">
            灵感广场
          </Link>
          <Link href="/templates" className="hidden sm:inline text-sm text-gray-600 hover:text-gray-900 transition-colors">
            提示词模板
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 min-w-0"
              >
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline max-w-[72px] sm:max-w-[80px] truncate">{user.nickname || user.name}</span>
                <span className="text-xs text-accent font-medium">{user.credits}</span>
              </Link>
              <button
                onClick={() => logout()}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                title="退出"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
