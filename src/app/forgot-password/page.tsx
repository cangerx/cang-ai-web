import { renderThemePage } from '@/lib/theme/renderThemePage'

// Route shell -> active theme provides the 'forgot-password' page.
// Edit src/themes/<theme>/pages/ForgotPasswordPage.tsx instead.
export default async function Page() {
  return renderThemePage('forgot-password')
}
