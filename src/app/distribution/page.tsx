import { renderThemePage } from '@/lib/theme/renderThemePage'

// Route shell -> active theme provides the 'distribution' page.
// Edit src/themes/<theme>/pages/DistributionPage.tsx instead.
export default async function Page() {
  return renderThemePage('distribution')
}
