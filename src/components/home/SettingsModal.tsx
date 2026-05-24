'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useSiteStore } from '@/stores/site'
import api from '@/lib/api'
import { toast } from '@/components/ui/Toaster'
import { PaymentModal } from './PaymentModal'

type Panel = 'login' | 'register' | 'forgot' | 'profile'
type LoginMethod = 'password' | 'email_code'

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: Props) {
  const { user, login, register, logout, fetchMe } = useAuthStore()
  const { config } = useSiteStore()

  const [panel, setPanel] = useState<Panel>('login')
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ type: 'err' | 'ok'; msg: string } | null>(null)
  const [agreed, setAgreed] = useState(false)

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginPwdVisible, setLoginPwdVisible] = useState(false)
  const [loginCode, setLoginCode] = useState('')
  const [codeSending, setCodeSending] = useState(false)
  const [codeCountdown, setCodeCountdown] = useState(0)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Register fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('')
  const [regInviteCode, setRegInviteCode] = useState('')
  const [regPwdVisible, setRegPwdVisible] = useState(false)

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [forgotNewPwd, setForgotNewPwd] = useState('')
  const [forgotConfirmPwd, setForgotConfirmPwd] = useState('')
  const [forgotPwdVisible, setForgotPwdVisible] = useState(false)
  const [forgotCodeCountdown, setForgotCodeCountdown] = useState(0)
  const forgotCountdownRef = useRef<NodeJS.Timeout | null>(null)

  // Profile / Settings tabs
  type SettingsTab = 'profile' | 'credits' | 'redeem' | 'invite' | 'general'
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile')
  const [redeemCode, setRedeemCode] = useState('')
  const [redeemMsg, setRedeemMsg] = useState<{ type: 'err' | 'ok'; msg: string } | null>(null)
  const [usageHistory, setUsageHistory] = useState<any[]>([])
  const [usageLoading, setUsageLoading] = useState(false)
  const [inviteCodes, setInviteCodes] = useState<any[]>([])
  const [consumed, setConsumed] = useState(0)
  const [rechargeAmount, setRechargeAmount] = useState(5)
  const [packages, setPackages] = useState<any[]>([])
  const [selectedPkgId, setSelectedPkgId] = useState<number | null>(null)
  const [payMethod, setPayMethod] = useState<'WECHAT' | 'ALIPAY' | 'UNIONPAY'>('WECHAT')
  const [payMethods, setPayMethods] = useState<{ wechat: boolean; alipay: boolean; unionpay: boolean }>({ wechat: true, alipay: true, unionpay: false })
  const [channelEnabled, setChannelEnabled] = useState<boolean>(true)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [activeOrder, setActiveOrder] = useState<any | null>(null)
  const [creditStats, setCreditStats] = useState({ subscription: 0, recharge: 0, reward: 0 })
  const [orderHistory, setOrderHistory] = useState<any[]>([])
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false)
  const [distApplying, setDistApplying] = useState(false)
  const [distMsg, setDistMsg] = useState<{ type: 'err' | 'ok'; msg: string } | null>(null)

  useEffect(() => {
    if (open) {
      setPanel(user ? 'profile' : 'login')
      setError(null)
      setRedeemMsg(null)
    }
  }, [open, user])

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
      if (forgotCountdownRef.current) clearInterval(forgotCountdownRef.current)
    }
  }, [])

  const startCountdown = (type: 'login' | 'forgot') => {
    const setter = type === 'login' ? setCodeCountdown : setForgotCodeCountdown
    const ref = type === 'login' ? countdownRef : forgotCountdownRef
    setter(60)
    if (ref.current) clearInterval(ref.current)
    ref.current = setInterval(() => {
      setter((prev) => {
        if (prev <= 1) { clearInterval(ref.current!); ref.current = null; return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const loadProfileData = useCallback(async () => {
    if (!user) return
    setUsageLoading(true)
    try {
      const { data } = await api.get('/usage', { params: { per_page: 20 } })
      setUsageHistory(data.data || data || [])
      if (data.consumed !== undefined) setConsumed(data.consumed)
      if (data.stats) setCreditStats(data.stats)
    } catch {}
    setUsageLoading(false)

    // invite_code comes from user object; no separate endpoint yet
    setInviteCodes(user.invite_code ? [{ code: user.invite_code }] : [])

  }, [user])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [open])

  useEffect(() => {
    if (open && panel === 'profile' && user) {
      loadProfileData()
    }
  }, [open, panel, user, loadProfileData])

  const handleSendCode = async (type: 'login' | 'forgot') => {
    const email = type === 'login' ? loginEmail : forgotEmail
    if (!email) { setError({ type: 'err', msg: '请输入邮箱地址' }); return }
    const sendSetter = type === 'login' ? setCodeSending : setCodeSending
    sendSetter(true); setError(null)
    try {
      await api.post('/send-code', { email, type })
      toast('验证码已发送', 'success')
      startCountdown(type)
    } catch (err: any) {
      setError({ type: 'err', msg: err.response?.data?.message || '发送失败' })
    } finally { sendSetter(false) }
  }

  const handleLogin = async () => {
    if (!agreed) { toast('请先阅读并同意《服务协议》和《隐私协议》', 'error'); return }
    if (loginMethod === 'password') {
      if (!loginEmail || !loginPassword) { setError({ type: 'err', msg: '请填写邮箱和密码' }); return }
      setLoading(true); setError(null)
      try {
        await login(loginEmail, loginPassword)
        toast('登录成功', 'success')
        setLoginEmail(''); setLoginPassword('')
      } catch (err: any) {
        setError({ type: 'err', msg: err.response?.data?.message || '登录失败' })
      } finally { setLoading(false) }
    } else {
      if (!loginEmail || !loginCode) { setError({ type: 'err', msg: '请填写邮箱和验证码' }); return }
      setLoading(true); setError(null)
      try {
        const { data } = await api.post('/login-code', { email: loginEmail, code: loginCode })
        useAuthStore.getState().setAuth(data.token, data.user)
        toast('登录成功', 'success')
        setLoginEmail(''); setLoginCode('')
      } catch (err: any) {
        setError({ type: 'err', msg: err.response?.data?.message || '登录失败' })
      } finally { setLoading(false) }
    }
  }

  const handleRegister = async () => {
    if (!agreed) { toast('请先阅读并同意《服务协议》和《隐私协议》', 'error'); return }
    if (!regName || !regEmail || !regPassword) { setError({ type: 'err', msg: '请填写必填项' }); return }
    if (regPassword !== regPasswordConfirm) { setError({ type: 'err', msg: '两次密码不一致' }); return }
    setLoading(true); setError(null)
    try {
      await register({
        name: regName, email: regEmail, password: regPassword,
        password_confirmation: regPasswordConfirm,
        invite_code: regInviteCode || undefined,
      })
      toast('注册成功', 'success')
    } catch (err: any) {
      setError({ type: 'err', msg: err.response?.data?.message || '注册失败' })
    } finally { setLoading(false) }
  }

  const handleResetPassword = async () => {
    if (!forgotEmail || !forgotCode) { setError({ type: 'err', msg: '请填写邮箱和验证码' }); return }
    if (!forgotNewPwd) { setError({ type: 'err', msg: '请输入新密码' }); return }
    if (forgotNewPwd !== forgotConfirmPwd) { setError({ type: 'err', msg: '两次密码不一致' }); return }
    setLoading(true); setError(null)
    try {
      await api.post('/reset-password', { email: forgotEmail, code: forgotCode, password: forgotNewPwd, password_confirmation: forgotConfirmPwd })
      setError({ type: 'ok', msg: '密码重置成功，请登录' })
      setTimeout(() => { setPanel('login'); setError(null) }, 1500)
    } catch (err: any) {
      setError({ type: 'err', msg: err.response?.data?.message || '重置失败' })
    } finally { setLoading(false) }
  }

  const loadPackages = useCallback(async () => {
    try {
      const { data } = await api.get('/billing/packages')
      const items = data?.items || []
      setPackages(items)
      if (items.length > 0 && !selectedPkgId) setSelectedPkgId(items[0].id)
      if (data?.channel) {
        setChannelEnabled(!!data.channel.enabled)
        const ms = data.channel.methods || {}
        const next = { wechat: !!ms.wechat, alipay: !!ms.alipay, unionpay: !!ms.unionpay }
        setPayMethods(next)
        // 当前选中的方式被关闭时，自动切到第一个开启的
        const currentOn = (next as any)[payMethod.toLowerCase()]
        if (!currentOn) {
          const first = (['WECHAT','ALIPAY','UNIONPAY'] as const).find(k => (next as any)[k.toLowerCase()])
          if (first) setPayMethod(first)
        }
      }
    } catch {}
  }, [selectedPkgId, payMethod])

  const loadOrderHistory = useCallback(async () => {
    setOrderHistoryLoading(true)
    try {
      const { data } = await api.get('/billing/orders', { params: { per_page: 20 } })
      setOrderHistory(data?.data || [])
    } catch {}
    setOrderHistoryLoading(false)
  }, [])

  useEffect(() => {
    if (open && settingsTab === 'credits') {
      loadPackages()
      loadOrderHistory()
    }
  }, [open, settingsTab, loadPackages, loadOrderHistory])

  const handleRecharge = async () => {
    if (!selectedPkgId) { toast('请选择充值套餐', 'error'); return }
    setCreatingOrder(true)
    try {
      const { data } = await api.post('/billing/orders', {
        package_id: selectedPkgId,
        pay_method: payMethod,
      })
      if (data?.ok && data.order) {
        if (!data.order.qr_code) { toast('支付未配置或暂不可用', 'error'); return }
        setActiveOrder(data.order)
      } else {
        toast(data?.msg || '创建订单失败', 'error')
      }
    } catch (err: any) {
      toast(err?.response?.data?.msg || '创建订单失败', 'error')
    } finally {
      setCreatingOrder(false)
    }
  }

  const handleRedeem = async () => {
    if (!redeemCode.trim()) { setRedeemMsg({ type: 'err', msg: '请输入兑换码' }); return }
    setLoading(true); setRedeemMsg(null)
    try {
      const { data } = await api.post('/redeem', { code: redeemCode.trim() })
      setRedeemMsg({ type: 'ok', msg: data.message || '兑换成功' })
      setRedeemCode('')
      fetchMe()
    } catch (err: any) {
      setRedeemMsg({ type: 'err', msg: err.response?.data?.message || '兑换失败' })
    } finally { setLoading(false) }
  }

  const handleLogout = async () => {
    await logout()
    toast('已退出登录', 'success')
    setPanel('login')
  }


  const copyText = (text: string, btn?: HTMLButtonElement) => {
    navigator.clipboard.writeText(text)
    if (btn) { const orig = btn.textContent; btn.textContent = '已复制'; setTimeout(() => { btn.textContent = orig }, 1500) }
  }

  const siteName = config?.site_name || 'CANG AI'
  const title = panel === 'login' ? '欢迎回来' : panel === 'register' ? '创建账号' : panel === 'forgot' ? '找回密码' : '个人中心'
  const subtitle = panel === 'login' ? `登录继续使用 ${siteName}` : panel === 'register' ? `注册加入 ${siteName}` : panel === 'forgot' ? '验证后设置新密码' : ''

  return (
    <div className={`settings-modal${open ? ' open' : ''}`} onClick={onClose}>
      <div className={`settings-card${panel === 'profile' ? ' wide' : ''}`} role="dialog" aria-label="账号" onClick={(e) => e.stopPropagation()}>
        {panel !== 'profile' && (
          <div className="settings-head">
            <h3>{title}</h3>
            <button className="icon-btn" type="button" aria-label="关闭" onClick={onClose}>×</button>
          </div>
        )}
        {panel === 'profile' && (
          <button className="icon-btn" type="button" aria-label="关闭" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>×</button>
        )}
        <div className={`settings-body${panel === 'profile' ? ' no-gap' : ''}`}>

          {/* ─── Login Panel ─── */}
          {panel === 'login' && (
            <div className="auth-panel">
              <p className="auth-subtitle">{subtitle}</p>

              {/* Login method tabs */}
              <div className="auth-tabs">
                <button type="button" className={`auth-tab${loginMethod === 'password' ? ' active' : ''}`} onClick={() => { setLoginMethod('password'); setError(null) }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                  密码
                </button>
                <button type="button" className={`auth-tab${loginMethod === 'email_code' ? ' active' : ''}`} onClick={() => { setLoginMethod('email_code'); setError(null) }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  邮箱
                </button>
              </div>

              {/* Password login */}
              {loginMethod === 'password' && (
                <div key="pwd" className="auth-panel">
                  <div className="settings-field">
                    <label>手机号/邮箱</label>
                    <input
                      className="settings-input" type="email"
                      placeholder="请输入手机号或邮箱" value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                  <div className="settings-field">
                    <label>密码</label>
                    <div className="input-wrap">
                      <input
                        className="settings-input"
                        type={loginPwdVisible ? 'text' : 'password'}
                        placeholder="请输入密码" value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      />
                      <button type="button" className="toggle-pwd-btn" aria-label="显示密码" onClick={() => setLoginPwdVisible(!loginPwdVisible)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Email code login */}
              {loginMethod === 'email_code' && (
                <div key="code" className="auth-panel">
                  <div className="settings-field">
                    <label>邮箱地址</label>
                    <input
                      className="settings-input" type="email"
                      placeholder="请输入邮箱地址" value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div className="settings-field">
                    <label>验证码</label>
                    <div className="verify-row">
                      <input
                        className="settings-input" type="text"
                        placeholder="请输入验证码" value={loginCode}
                        onChange={(e) => setLoginCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      />
                      <button
                        type="button" className="verify-btn"
                        disabled={codeSending || codeCountdown > 0}
                        onClick={() => handleSendCode('login')}
                      >
                        {codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className={`auth-error ${error.type}`}>{error.msg}</div>}

              <label className="auth-agree">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>我已阅读并同意 <a href="/terms" target="_blank">《服务协议》</a> 和 <a href="/privacy" target="_blank">《隐私协议》</a></span>
              </label>

              <div className="settings-foot">
                <button className="black-btn" type="button" onClick={handleLogin} disabled={loading}>
                  {loading ? '登录中...' : '登录'}
                </button>

                {(config?.login_methods?.github || config?.login_methods?.wechat) && (
                  <div className="oauth-section" style={{ width: '100%' }}>
                    <div className="oauth-divider">
                      <span>第三方快捷登录</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      {config.login_methods.github && (
                        <a href="/api/auth/github" className="oauth-btn" style={{ flex: 1, textDecoration: 'none', marginBottom: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                          </svg>
                          GitHub
                        </a>
                      )}
                      {config.login_methods.wechat && (
                        <a href="/api/auth/wechat" className="oauth-btn oauth-btn-wechat" style={{ flex: 1, textDecoration: 'none', marginBottom: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8.88 12.18c0-.39-.31-.7-.7-.7-.39 0-.7.31-.7.7 0 .39.31.7.7.7.39 0 .7-.31.7-.7zm4.18 0c0-.39-.31-.7-.7-.7-.39 0-.7.31-.7.7 0 .39.31.7.7.7.39 0 .7-.31.7-.7zm8.38-.85c0-3.44-3.72-6.24-8.31-6.24-4.59 0-8.31 2.8-8.31 6.24 0 3.44 3.72 6.24 8.31 6.24.97 0 1.91-.13 2.78-.37l2.25 1.13c.2.1.44.02.54-.18.04-.08.05-.17.02-.25l-.47-1.74c1.99-1.12 3.32-3.05 3.32-5.07zm-11.45.85c0-.49-.39-.88-.88-.88-.49 0-.88.39-.88.88 0 .49.39.88.88.88.49 0 .88-.39.88-.88zm4.18 0c0-.49-.39-.88-.88-.88-.49 0-.88.39-.88.88 0 .49.39.88.88.88.49 0 .88-.39.88-.88z"/>
                          </svg>
                          微信登录
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="auth-links auth-links-polished">
                  <span className="auth-register-text">
                    没有账号？
                    <button className="auth-register-btn" type="button" onClick={() => { setPanel('register'); setError(null) }}>立即注册</button>
                  </span>
                  <button className="auth-forgot-pill" type="button" onClick={() => { setPanel('forgot'); setError(null) }}>忘记密码</button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Register Panel ─── */}
          {panel === 'register' && (
            <div className="auth-panel">
              <p className="auth-subtitle">{subtitle}</p>
              <div className="settings-field">
                <label>用户名</label>
                <input className="settings-input" type="text" placeholder="输入昵称" value={regName} onChange={(e) => setRegName(e.target.value)} />
              </div>
              <div className="settings-field">
                <label>邮箱</label>
                <input className="settings-input" type="email" placeholder="请输入邮箱地址" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              </div>
              <div className="settings-field">
                <label>密码</label>
                <div className="input-wrap">
                  <input className="settings-input" type={regPwdVisible ? 'text' : 'password'} placeholder="至少 6 位字符" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                  <button type="button" className="toggle-pwd-btn" aria-label="显示密码" onClick={() => setRegPwdVisible(!regPwdVisible)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>
              <div className="settings-field">
                <label>确认密码</label>
                <div className="input-wrap">
                  <input className="settings-input" type={regPwdVisible ? 'text' : 'password'} placeholder="再次输入密码" value={regPasswordConfirm} onChange={(e) => setRegPasswordConfirm(e.target.value)} />
                </div>
              </div>
              <div className="settings-field">
                <label>邀请码 <span style={{ color: '#bbb', fontWeight: 400 }}>(选填)</span></label>
                <input className="settings-input" type="text" placeholder="输入邀请码" maxLength={32} value={regInviteCode} onChange={(e) => setRegInviteCode(e.target.value)} />
              </div>

              {error && <div className={`auth-error ${error.type}`}>{error.msg}</div>}

              <label className="auth-agree">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>我已阅读并同意 <a href="/terms" target="_blank">《服务协议》</a> 和 <a href="/privacy" target="_blank">《隐私协议》</a></span>
              </label>

              <div className="settings-foot">
                <button className="black-btn" type="button" onClick={handleRegister} disabled={loading}>
                  {loading ? '注册中...' : '创建账号'}
                </button>
                <div className="auth-links" style={{ justifyContent: 'center' }}>
                  <span className="auth-register-text">
                    已有账号？
                    <button className="auth-register-btn" type="button" onClick={() => { setPanel('login'); setError(null) }}>去登录</button>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Forgot Password Panel ─── */}
          {panel === 'forgot' && (
            <div className="auth-panel">
              <p className="auth-subtitle">{subtitle}</p>
              <div className="settings-field">
                <label>邮箱</label>
                <input className="settings-input" type="email" placeholder="请输入邮箱" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
              </div>
              <div className="settings-field">
                <label>验证码</label>
                <div className="verify-row">
                  <input className="settings-input" type="text" placeholder="请输入验证码" value={forgotCode} onChange={(e) => setForgotCode(e.target.value)} />
                  <button
                    type="button" className="verify-btn"
                    disabled={codeSending || forgotCodeCountdown > 0}
                    onClick={() => handleSendCode('forgot')}
                  >
                    {forgotCodeCountdown > 0 ? `${forgotCodeCountdown}s` : '发送验证码'}
                  </button>
                </div>
              </div>
              <div className="settings-field">
                <label>新密码</label>
                <div className="input-wrap">
                  <input className="settings-input" type={forgotPwdVisible ? 'text' : 'password'} placeholder="至少 6 位" value={forgotNewPwd} onChange={(e) => setForgotNewPwd(e.target.value)} />
                  <button type="button" className="toggle-pwd-btn" aria-label="显示密码" onClick={() => setForgotPwdVisible(!forgotPwdVisible)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>
              <div className="settings-field">
                <label>确认新密码</label>
                <input className="settings-input" type={forgotPwdVisible ? 'text' : 'password'} placeholder="再次输入新密码" value={forgotConfirmPwd} onChange={(e) => setForgotConfirmPwd(e.target.value)} />
              </div>

              {error && <div className={`auth-error ${error.type}`}>{error.msg}</div>}

              <div className="settings-foot">
                <button className="black-btn" type="button" onClick={handleResetPassword} disabled={loading}>
                  {loading ? '重置中...' : '重置密码'}
                </button>
                <div className="auth-links" style={{ justifyContent: 'center' }}>
                  <button className="auth-link-btn" type="button" onClick={() => { setPanel('login'); setError(null) }}>← 返回登录</button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Settings Panel (logged in) ─── */}
          {panel === 'profile' && user && (
            <div className="settings-layout">
              {/* Sidebar */}
              <div className="settings-sidebar">
                <h2 className="settings-sidebar-title">设置</h2>
                <button type="button" className={`settings-nav-item${settingsTab === 'profile' ? ' active' : ''}`} onClick={() => setSettingsTab('profile')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  个人资料
                </button>
                <button type="button" className={`settings-nav-item${settingsTab === 'credits' ? ' active' : ''}`} onClick={() => setSettingsTab('credits')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
                  积分明细
                </button>
                <button type="button" className={`settings-nav-item${settingsTab === 'redeem' ? ' active' : ''}`} onClick={() => setSettingsTab('redeem')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4M8 3v4M2 11h20"/></svg>
                  兑换码
                </button>
                <button type="button" className={`settings-nav-item${settingsTab === 'invite' ? ' active' : ''}`} onClick={() => setSettingsTab('invite')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  邀请
                </button>
                <button type="button" className={`settings-nav-item${settingsTab === 'general' ? ' active' : ''}`} onClick={() => setSettingsTab('general')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 9 3.17V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  通用
                </button>
              </div>

              {/* Content */}
              <div className="settings-content" key={settingsTab}>

                {/* ── 个人资料 ── */}
                {settingsTab === 'profile' && (
                  <>
                    <h3 className="settings-content-title">个人资料</h3>
                    <div className="profile-info-card">
                      <div className="profile-info-avatar">
                        {user.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.avatar_url} alt="" />
                        ) : (
                          (user.nickname || user.name || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="profile-info-name">{user.nickname || user.name}</div>
                        <div className="profile-info-bio">这个人很懒，什么都没写</div>
                      </div>
                    </div>

                    <div className="settings-section">
                      <h4 className="settings-section-title">基本信息</h4>
                      <div className="settings-row">
                        <span className="settings-row-label">用户ID</span>
                        <span className="settings-row-value">{user.id}</span>
                      </div>
                      <div className="settings-row">
                        <span className="settings-row-label">注册时间</span>
                        <span className="settings-row-value">{user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
                      </div>
                    </div>

                    <div className="settings-section">
                      <h4 className="settings-section-title">账号绑定</h4>
                      <div className="settings-row">
                        <span className="settings-row-label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>
                          手机号
                        </span>
                        <span className="settings-row-value">{user.phone || '未绑定'}</span>
                      </div>
                      <div className="settings-row">
                        <span className="settings-row-label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                          邮箱
                        </span>
                        <span className="settings-row-value">{user.email || '未绑定'}</span>
                      </div>
                    </div>

                    <div className="settings-section">
                      <h4 className="settings-section-title">账号安全</h4>
                      <div className="settings-row">
                        <span className="settings-row-label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                          密码
                        </span>
                        <button type="button" className="settings-row-action">修改密码</button>
                      </div>
                    </div>

                    {!user.is_distributor && (
                      <div className="dist-apply-card">
                        <div className="dist-apply-desc">开通分销，邀请好友注册即可获得返利积分</div>
                        <button
                          className="black-btn"
                          type="button"
                          disabled={distApplying}
                          style={{ width: '100%', borderRadius: 8 }}
                          onClick={async () => {
                            setDistApplying(true)
                            setDistMsg(null)
                            try {
                              await api.post('/distributor/apply')
                              setDistMsg({ type: 'ok', msg: '分销开通成功！' })
                              fetchMe()
                            } catch (e: any) {
                              setDistMsg({ type: 'err', msg: e?.response?.data?.message || '申请失败' })
                            } finally {
                              setDistApplying(false)
                            }
                          }}
                        >
                          {distApplying ? '申请中...' : '申请开通分销'}
                        </button>
                        {distMsg && <div className={`auth-error ${distMsg.type}`} style={{ marginTop: 8 }}>{distMsg.msg}</div>}
                      </div>
                    )}

                    <div style={{ paddingTop: 14, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'center', gap: 16 }}>
                      <button className="ghost-btn" type="button" onClick={handleLogout} style={{ fontSize: 12, color: '#a1a1aa' }}>退出登录</button>
                    </div>
                  </>
                )}

                {/* ── 积分明细 ── */}
                {settingsTab === 'credits' && (
                  <>
                    <h3 className="settings-content-title">积分明细</h3>
                    <div className="credits-stats">
                      <div className="credits-stat-card">
                        <div className="credits-stat-label">订阅积分</div>
                        <div className="credits-stat-value">{creditStats.subscription}</div>
                        <div className="credits-stat-sub">开通后可用</div>
                      </div>
                      <div className="credits-stat-card">
                        <div className="credits-stat-label">充值积分</div>
                        <div className="credits-stat-value">{creditStats.recharge}</div>
                      </div>
                      <div className="credits-stat-card">
                        <div className="credits-stat-label">系统奖励</div>
                        <div className="credits-stat-value">{creditStats.reward || user.credits}</div>
                      </div>
                    </div>

                    <div className="recharge-card">
                      <div className="recharge-header">
                        <span className="recharge-title">选择充值套餐</span>
                        {packages.find((p) => p.id === selectedPkgId) && (
                          <div className="recharge-points">
                            {packages.find((p) => p.id === selectedPkgId)?.total_credits} <span>积分</span>
                          </div>
                        )}
                      </div>
                      <div className="recharge-amounts">
                        {packages.length === 0 && (
                          <div style={{ fontSize: 12, color: '#a1a1aa', gridColumn: '1 / -1' }}>加载套餐中…</div>
                        )}
                        {packages.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className={`recharge-amount-btn${selectedPkgId === p.id ? ' active' : ''}`}
                            onClick={() => setSelectedPkgId(p.id)}
                          >
                            <div style={{ fontWeight: 700, fontSize: 14 }}>¥ {p.amount}</div>
                            <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>
                              {p.credits} 积分{p.bonus_credits > 0 ? ` +${p.bonus_credits}` : ''}
                            </div>
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
                        {payMethods.wechat && (
                          <button
                            type="button"
                            className={`recharge-amount-btn${payMethod === 'WECHAT' ? ' active' : ''}`}
                            style={{ flex: 1 }}
                            onClick={() => setPayMethod('WECHAT')}
                          >微信支付</button>
                        )}
                        {payMethods.alipay && (
                          <button
                            type="button"
                            className={`recharge-amount-btn${payMethod === 'ALIPAY' ? ' active' : ''}`}
                            style={{ flex: 1 }}
                            onClick={() => setPayMethod('ALIPAY')}
                          >支付宝</button>
                        )}
                        {payMethods.unionpay && (
                          <button
                            type="button"
                            className={`recharge-amount-btn${payMethod === 'UNIONPAY' ? ' active' : ''}`}
                            style={{ flex: 1 }}
                            onClick={() => setPayMethod('UNIONPAY')}
                          >银联</button>
                        )}
                        {!payMethods.wechat && !payMethods.alipay && !payMethods.unionpay && (
                          <div style={{ flex: 1, fontSize: 12, color: '#a1a1aa', padding: '10px 0', textAlign: 'center' }}>
                            暂无可用支付方式
                          </div>
                        )}
                      </div>

                      <button
                        className="black-btn"
                        type="button"
                        style={{ width: '100%', borderRadius: 12 }}
                        disabled={creatingOrder || !selectedPkgId || !channelEnabled || !(payMethods.wechat || payMethods.alipay || payMethods.unionpay)}
                        onClick={handleRecharge}
                      >
                        {!channelEnabled
                          ? '支付暂不可用'
                          : creatingOrder
                            ? '创建订单中…'
                            : `立即充值 ¥${packages.find((p) => p.id === selectedPkgId)?.amount || ''}`}
                      </button>
                    </div>

                    <div className="usage-card">
                      <div className="usage-card-title">充值记录</div>
                      {orderHistoryLoading ? (
                        <div style={{ fontSize: 12, color: '#a1a1aa' }}>加载中...</div>
                      ) : orderHistory.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#a1a1aa' }}>暂无充值记录</div>
                      ) : (
                        orderHistory.map((o: any, i: number) => {
                          const STATUS_MAP: Record<string, { label: string; color: string }> = {
                            pending: { label: '待支付', color: '#f59e0b' },
                            paid: { label: '已支付', color: '#16a34a' },
                            failed: { label: '失败', color: '#ef4444' },
                            cancelled: { label: '已取消', color: '#a1a1aa' },
                            refunded: { label: '已退款', color: '#6b7280' },
                          }
                          const s = STATUS_MAP[o.status] || { label: o.status, color: '#71717a' }
                          const dt = o.created_at ? new Date(o.created_at) : null
                          const dateStr = dt ? `${dt.getMonth() + 1}/${dt.getDate()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}` : ''
                          return (
                            <div className="usage-item" key={o.order_no || i}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="usage-item-desc" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span>{o.subject || `充值 ¥${o.amount}`}</span>
                                  <span style={{ fontSize: 10, color: s.color, background: `${s.color}18`, padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>{s.label}</span>
                                </div>
                                <div className="usage-item-date">{dateStr}</div>
                              </div>
                              <div className="usage-item-amount positive">+{o.credits}</div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    <div className="usage-card">
                      <div className="usage-card-title">积分使用详情</div>
                      {usageLoading ? (
                        <div style={{ fontSize: 12, color: '#a1a1aa' }}>加载中...</div>
                      ) : usageHistory.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#a1a1aa' }}>暂无记录</div>
                      ) : (
                        usageHistory.map((item: any, i: number) => {
                          const APP_LABELS: Record<string, string> = { 'image-gen': '图片生成', 'video-gen': '视频生成', 'reverse': '反推提示词', 'prompt-tool': '提示词工具' }
                          const QUALITY_LABELS: Record<string, string> = { low: '标清', medium: '高清', high: '超清', auto: '自动' }
                          const appLabel = APP_LABELS[item.app_name] || item.app_name || '消费'
                          const refunded = !!item.refunded_at
                          const cost = Number(item.cost_credits || 0)
                          const dt = item.created_at ? new Date(item.created_at) : null
                          const dateStr = dt ? `${dt.getMonth() + 1}月${dt.getDate()}日 ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}` : ''
                          return (
                            <div className="usage-item" key={item.id || i}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="usage-item-desc" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <span>{appLabel}</span>
                                  {item.model_name && <span style={{ fontSize: 11, color: '#71717a', background: '#f4f4f5', padding: '1px 6px', borderRadius: 4 }}>{item.model_name}</span>}
                                  {item.quality && <span style={{ fontSize: 11, color: '#71717a' }}>· {QUALITY_LABELS[item.quality] || item.quality}</span>}
                                  {refunded && <span style={{ fontSize: 10, color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>已退还</span>}
                                </div>
                                <div className="usage-item-date">
                                  {dateStr}
                                  {item.task_id && <span style={{ marginLeft: 8, color: '#c4c4c8' }}>#{String(item.task_id).slice(0, 8)}</span>}
                                </div>
                              </div>
                              <div className={`usage-item-amount ${refunded ? 'positive' : 'negative'}`} style={{ textDecoration: refunded ? 'line-through' : 'none', opacity: refunded ? 0.55 : 1 }}>
                                -{cost}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </>
                )}

                {/* ── 兑换码 ── */}
                {settingsTab === 'redeem' && (
                  <>
                    <h3 className="settings-content-title">兑换码</h3>
                    <div style={{ background: '#fafafa', borderRadius: 14, padding: 20 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 6 }}>兑换码兑换</div>
                      <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>输入兑换码兑换积分或会员时长。每个兑换码仅可使用一次。</div>
                      <div className="verify-row">
                        <input className="settings-input" type="text" placeholder="请输入兑换码" maxLength={32} value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} />
                        <button className="verify-btn" type="button" onClick={handleRedeem} disabled={loading}>立即兑换</button>
                      </div>
                      {redeemMsg && <div className={`auth-error ${redeemMsg.type}`} style={{ marginTop: 10 }}>{redeemMsg.msg}</div>}
                    </div>
                  </>
                )}

                {/* ── 邀请 ── */}
                {settingsTab === 'invite' && (
                  <>
                    <h3 className="settings-content-title">邀请</h3>
                    <div className="invite-card">
                      <div className="invite-card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="8" width="18" height="14" rx="2"/><path d="M12 8v14M3 12h18M7.5 8C7.5 5.5 9 4 12 4s4.5 1.5 4.5 4"/></svg> 邀请好友
                      </div>
                      <div className="invite-card-desc">把 {siteName} 分享给你的好友，共同探索 AI 的无限可能。</div>
                      <div className="invite-card-highlight">每成功邀请一位好友，可获得 100 积分奖励</div>
                    </div>

                    <div className="invite-codes-header">
                      <span className="invite-codes-title">我的邀请码</span>
                      <button type="button" className="invite-codes-refresh" onClick={loadProfileData}>刷新</button>
                    </div>

                    {inviteCodes.length === 0 && user.invite_code && (
                      <div className="invite-code-item">
                        <div>
                          <div className="invite-code-text">{user.invite_code}</div>
                          <div className="invite-code-meta">可用</div>
                        </div>
                        <button type="button" className="invite-code-copy" onClick={(e) => copyText(user.invite_code || '', e.currentTarget as HTMLButtonElement)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                      </div>
                    )}
                    {inviteCodes.map((code: any, i: number) => (
                      <div className="invite-code-item" key={i}>
                        <div>
                          <div className="invite-code-text">{code.code}</div>
                          <div className="invite-code-meta">{code.used ? '已使用' : '未使用'} · {code.created_at ? new Date(code.created_at).toLocaleDateString('zh-CN') : ''}</div>
                        </div>
                        <button type="button" className="invite-code-copy" onClick={(e) => copyText(code.code, e.currentTarget as HTMLButtonElement)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* ── 通用 ── */}
                {settingsTab === 'general' && (
                  <>
                    <h3 className="settings-content-title">通用设置</h3>

                    <div className="settings-section">
                      <h4 className="general-section-title">外观</h4>
                      <div className="general-row">
                        <span className="general-row-label">主题模式</span>
                        <span className="general-row-value">跟随系统</span>
                      </div>
                    </div>

                    <div className="settings-section">
                      <h4 className="general-section-title">语言</h4>
                      <div className="general-row">
                        <span className="general-row-label">界面语言</span>
                        <span className="general-row-value">简体中文</span>
                      </div>
                    </div>

                    <div className="settings-section">
                      <h4 className="general-section-title">关于</h4>
                      <div className="general-row">
                        <span className="general-row-label">版本</span>
                        <span className="general-row-value">1.0.0</span>
                      </div>
                      <a href="/terms" target="_blank" className="general-row" style={{ textDecoration: 'none' }}>
                        <span className="general-row-label">服务条款</span>
                        <span className="general-row-value">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                        </span>
                      </a>
                      <a href="/privacy" target="_blank" className="general-row" style={{ textDecoration: 'none' }}>
                        <span className="general-row-label">隐私政策</span>
                        <span className="general-row-value">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                        </span>
                      </a>
                    </div>
                  </>
                )}

              </div>
            </div>
          )}

        </div>
      </div>
      <PaymentModal
        open={!!activeOrder}
        order={activeOrder}
        onClose={() => { setActiveOrder(null); loadProfileData(); loadOrderHistory() }}
        onPaid={() => { toast('充值成功，积分已到账', 'success'); loadProfileData(); loadOrderHistory() }}
      />
    </div>
  )
}
