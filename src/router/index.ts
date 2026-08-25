import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, saved) {
    return saved ?? { top: 0 }
  },
})

/**
 * Navigation guard.
 *
 * This is UX, not security. Anyone can edit the store in devtools and reach
 * `/dashboard`; what they get is an empty shell, because the backend rejects
 * every request the shell makes. Real enforcement lives in the API's route
 * groups: `/api/*` behind auth middleware, `/api/admin/*` additionally behind a
 * superadmin role check. The guard's job is to keep honest users out of dead
 * screens and to send them somewhere sensible.
 */
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // Preserve where they were headed so login can return them there.
    return { name: 'login', query: { next: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  const required = to.meta.roles
  if (required?.length && !required.some((role) => auth.roles.includes(role))) {
    return { name: 'forbidden' }
  }

  return true
})

export default router
