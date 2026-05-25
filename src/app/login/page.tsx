import { renderThemePage } from '@/lib/theme/renderThemePage'

// Route shell -> active theme provides the 'login' page.
// Edit src/themes/<theme>/pages/LoginPage.tsx instead.
export default async function Page() {
  return renderThemePage('login')
}
