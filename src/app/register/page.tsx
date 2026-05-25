import { renderThemePage } from '@/lib/theme/renderThemePage'

// Route shell -> active theme provides the 'register' page.
// Edit src/themes/<theme>/pages/RegisterPage.tsx instead.
export default async function Page() {
  return renderThemePage('register')
}
