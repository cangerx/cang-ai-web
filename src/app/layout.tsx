import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/Toaster'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/api/config`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      return {
        title: data.site_name ? `${data.site_name} - AI智能绘画平台` : 'CANG-AI 绘图 - AI智能绘画平台',
        description: data.site_description || 'AI绘图平台，支持文生图、图生图、提示词反推，多种AI模型一键生成高质量创意图片。',
        keywords: data.site_keywords || 'AI绘图,AI画图,AI生成图片,文生图,图生图,AI绘画',
      }
    }
  } catch {}
  return {
    title: 'CANG-AI 绘图 - AI智能绘画平台 | 一键生成高质量图片',
    description: 'CANG-AI 是专业的AI绘图平台，支持文生图、图生图、提示词反推，多种AI模型一键生成高质量创意图片。简单易用，快速出图。',
    keywords: 'AI绘图,AI画图,AI生成图片,文生图,图生图,AI绘画,CANG-AI,人工智能绘画,AI创作',
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
