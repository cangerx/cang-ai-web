import { renderThemePage } from '@/lib/theme/renderThemePage'

// Route shell -> active theme provides the 'pricing' page.
// Edit src/themes/<theme>/pages/PricingPage.tsx instead.
export default async function Page() {
  return renderThemePage('pricing')
}
