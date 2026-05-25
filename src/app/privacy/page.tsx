import { renderThemePage } from '@/lib/theme/renderThemePage'

// Route shell -> active theme provides the 'privacy' page.
// Edit src/themes/<theme>/pages/PrivacyPage.tsx instead.
export default async function Page() {
  return renderThemePage('privacy')
}
