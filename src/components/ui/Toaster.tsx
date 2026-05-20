'use client'

import { useEffect, useState } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let addToast: (message: string, type?: Toast['type']) => void = () => {}

export function toast(message: string, type: Toast['type'] = 'info') {
  addToast(message, type)
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    addToast = (message, type = 'info') => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3000)
    }
  }, [])

  if (!toasts.length) return null

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium pointer-events-auto backdrop-blur ${
            t.type === 'success' ? 'bg-green-500/95 text-white' :
            t.type === 'error' ? 'bg-red-500/95 text-white' :
            'bg-black/85 text-white'
          }`}
          style={{ animation: 'toastIn 0.35s cubic-bezier(0.22,1,0.36,1)' }}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
