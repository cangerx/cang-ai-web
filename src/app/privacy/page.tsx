export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto prose prose-gray">
      <h1>隐私政策</h1>
      <p className="text-gray-500">最后更新：2024年1月</p>

      <h2>1. 信息收集</h2>
      <p>我们收集以下信息：</p>
      <ul>
        <li>注册信息（邮箱、昵称）</li>
        <li>使用记录（生成的图片、提示词）</li>
        <li>设备信息（浏览器类型、IP 地址）</li>
      </ul>

      <h2>2. 信息使用</h2>
      <p>收集的信息用于：</p>
      <ul>
        <li>提供和改进服务</li>
        <li>用户身份验证</li>
        <li>防止滥用</li>
      </ul>

      <h2>3. 信息保护</h2>
      <p>我们采用行业标准的安全措施保护用户数据，不会将用户信息出售给第三方。</p>

      <h2>4. Cookie 使用</h2>
      <p>网站使用 Cookie 和 LocalStorage 保存登录状态和用户偏好设置。</p>

      <h2>5. 联系我们</h2>
      <p>如有隐私相关问题，请通过站内消息联系管理员。</p>
    </div>
  )
}
