import { renderThemePage } from '@/lib/theme/renderThemePage'

// Route shell -> active theme provides the 'tasks' page.
// Edit src/themes/<theme>/pages/TasksPage.tsx instead.
export default async function Page() {
  return renderThemePage('tasks')
}
