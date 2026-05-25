import { renderThemePage } from '@/lib/theme/renderThemePage'

// Route shell -> active theme provides the 'explore' page.
// Edit src/themes/<theme>/pages/ExplorePage.tsx instead.
export default async function Page() {
  return renderThemePage('explore')
}
