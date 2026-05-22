import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/Toaster'

export async function generateMetadata(): Promise<Metadata> {
  const serverApiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1'
  try {
    const res = await fetch(`${serverApiUrl}/api/config`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      return {
        title: data.site_name ? `${data.site_name} - AI智能绘画平台` : 'Visionary AI - 智能创意绘画平台',
        description: data.site_description || 'AI绘图平台，支持文生图、图生图、提示词反推，多种AI模型一键生成高质量创意图片。',
        keywords: data.site_keywords || 'AI绘图,AI画图,AI生成图片,文生图,图生图,AI绘画',
      }
    }
  } catch {}
  return {
    title: 'Visionary AI - 智能创意绘画平台',
    description: '专业AI绘图平台，支持文生图、图生图、提示词反推，多种AI模型一键生成高质量创意图片。简单易用，快速出图。',
    keywords: 'AI绘图,AI画图,AI生成图片,文生图,图生图,AI绘画,智能绘画,AI创作',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
