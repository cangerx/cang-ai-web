import { renderThemePage } from '@/lib/theme/renderThemePage'

// Route shell -> active theme provides the 'terms' page.
// Edit src/themes/<theme>/pages/TermsPage.tsx instead.
export default async function Page() {
  return renderThemePage('terms')
}
