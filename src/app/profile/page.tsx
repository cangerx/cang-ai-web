import { renderThemePage } from '@/lib/theme/renderThemePage'

// Route shell -> active theme provides the 'profile' page.
// Edit src/themes/<theme>/pages/ProfilePage.tsx instead.
export default async function Page() {
  return renderThemePage('profile')
}
