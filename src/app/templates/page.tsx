import { renderThemePage } from '@/lib/theme/renderThemePage'

// Route shell -> active theme provides the 'templates' page.
// Edit src/themes/<theme>/pages/TemplatesPage.tsx instead.
export default async function Page() {
  return renderThemePage('templates')
}
