'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { toast } from '@/components/ui/Toaster'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast('请填写邮箱', 'error')
    setLoading(true)
    try {
      await api.post('/forgot-password', { email })
      setSent(true)
      toast('重置链接已发送到邮箱', 'success')
    } catch (err: any) {
      toast(err.response?.data?.message || '发送失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">邮件已发送</h1>
          <p className="text-gray-500 mb-4">请查看邮箱中的重置密码链接。</p>
          <Link href="/login" className="text-accent font-medium">返回登录</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-8">忘记密码</h1>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {loading ? '发送中...' : '发送重置链接'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-gray-500 hover:text-gray-700">返回登录</Link>
        </p>
      </div>
    </div>
  )
}
