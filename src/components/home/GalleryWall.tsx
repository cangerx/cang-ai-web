'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface GalleryItem {
  id: number
  image_url: string
  prompt: string
  model: string
}

export function GalleryWall() {
  const [items, setItems] = useState<GalleryItem[]>([])

  useEffect(() => {
    api.get('/explore', { params: { limit: 12 } })
      .then(({ data }) => setItems(data.data || data))
      .catch(() => {})
  }, [])

  if (!items.length) return null

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold text-gray-900 mb-4">灵感广场</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 cursor-pointer"
          >
            <img
              src={item.image_url}
              alt={item.prompt}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <p className="text-white text-xs line-clamp-2">{item.prompt}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
