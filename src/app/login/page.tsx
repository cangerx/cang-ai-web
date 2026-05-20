'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth'
import { useSiteStore } from '@/stores/site'
import { toast } from '@/components/ui/Toaster'
import { Github } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const { config } = useSiteStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast('请填写邮箱和密码', 'error')
    setLoading(true)
    try {
      await login(email, password)
      toast('登录成功', 'success')
      router.push('/generate')
    } catch (err: any) {
      toast(err.response?.data?.message || '登录失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-8">登录</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-gray-500 hover:text-gray-700">忘记密码？</Link>
          <Link href="/register" className="text-accent font-medium">注册账号</Link>
        </div>

        {(config?.login_methods?.github || config?.login_methods?.wechat) && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400 mb-3">第三方登录</p>
            <div className="flex justify-center gap-3">
              {config.login_methods.github && (
                <a
                  href="/api/auth/github"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition"
                >
                  <Github className="w-4 h-4" /> GitHub
                </a>
              )}
              {config.login_methods.wechat && (
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition">
                  微信登录
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
