'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

interface PaymentOrder {
  order_no: string
  amount: number
  credits: number
  status: string
  qr_code?: string
  pay_method?: string
  paid_at?: string
  expires_at?: string
}

interface Props {
  open: boolean
  order: PaymentOrder | null
  onClose: () => void
  onPaid?: (order: PaymentOrder) => void
}

const STATUS_LABELS: Record<string, string> = {
  pending: '等待支付',
  paid: '支付成功',
  failed: '支付失败',
  cancelled: '已取消',
  refunded: '已退款',
}

export function PaymentModal({ open, order, onClose, onPaid }: Props) {
  const { fetchMe } = useAuthStore()
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [current, setCurrent] = useState<PaymentOrder | null>(order)
  const [polling, setPolling] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const paidRef = useRef(false)

  useEffect(() => { setCurrent(order); paidRef.current = false }, [order])

  // Generate QR image
  useEffect(() => {
    if (!current?.qr_code) { setQrDataUrl(''); return }
    QRCode.toDataURL(current.qr_code, { width: 260, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''))
  }, [current?.qr_code])

  // Poll order status
  useEffect(() => {
    if (!open || !current || current.status !== 'pending') return
    setPolling(true)
    const tick = async () => {
      try {
        const { data } = await api.get(`/billing/orders/${current.order_no}`)
        if (data?.order) {
          setCurrent(data.order)
          if (data.order.status === 'paid' && !paidRef.current) {
            paidRef.current = true
            await fetchMe()
            onPaid?.(data.order)
          } else if (['failed', 'cancelled', 'refunded'].includes(data.order.status)) {
            if (pollRef.current) clearInterval(pollRef.current)
            setPolling(false)
          }
        }
      } catch {}
    }
    pollRef.current = setInterval(tick, 2500)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      setPolling(false)
    }
  }, [open, current?.order_no, current?.status, fetchMe, onPaid])

  // Lock body scroll
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open || !current) return null

  const paid = current.status === 'paid'

  return createPortal(
    <div className="pay-modal" onClick={onClose}>
      <div className="pay-overlay" />
      <div className="pay-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="pay-head">
          <h3>{paid ? '支付成功' : '扫码支付'}</h3>
          <button className="icon-btn" type="button" onClick={onClose}>×</button>
        </div>

        <div className="pay-amount">
          <div className="pay-amount-num">¥{current.amount.toFixed(2)}</div>
          <div className="pay-amount-meta">到账 <b>{current.credits}</b> 积分</div>
        </div>

        {paid ? (
          <div className="pay-success">
            <div className="pay-check">✓</div>
            <div className="pay-success-text">支付成功！积分已到账</div>
            <button className="black-btn" style={{ width: '100%', borderRadius: 12 }} onClick={onClose}>完成</button>
          </div>
        ) : (
          <>
            <div className="pay-qr-wrap">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="支付二维码" className="pay-qr" />
              ) : (
                <div className="pay-qr-empty">二维码生成中…</div>
              )}
            </div>
            <div className="pay-tip">
              请使用 <b>{current.pay_method === 'WECHAT' ? '微信' : current.pay_method === 'ALIPAY' ? '支付宝' : '对应'}</b> 扫一扫
            </div>
            <div className="pay-status">
              <span className={`pay-dot ${current.status}`} />
              {STATUS_LABELS[current.status] || current.status}
              {polling && current.status === 'pending' && <span className="pay-polling">正在检测…</span>}
            </div>
            <div className="pay-order-no">订单号：{current.order_no}</div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
