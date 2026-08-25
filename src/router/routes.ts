import type { RouteRecordRaw } from 'vue-router'
import type { RoleSlug } from '@/api/types'

declare module 'vue-router' {
  interface RouteMeta {
    /** Requires a session. Enforced for navigation only — the API is the real gate. */
    requiresAuth?: boolean
    /** Redirect away when a session is already held (login, register, …). */
    guestOnly?: boolean
    /** Roles permitted to navigate here. Absent means any authenticated user. */
    roles?: RoleSlug[]
    /** Shown in the dashboard header. */
    title?: string
  }
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/public/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/public/HomeView.vue'),
      },
    ],
  },

  {
    path: '/',
    component: () => import('@/layouts/auth/AuthLayout.vue'),
    meta: { guestOnly: true },
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/views/auth/RegisterView.vue'),
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('@/views/auth/ForgotPasswordView.vue'),
      },
      {
        path: 'reset-password',
        name: 'reset-password',
        component: () => import('@/views/auth/ResetPasswordView.vue'),
      },
    ],
  },

  {
    path: '/dashboard',
    component: () => import('@/layouts/dashboard/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/dashboard/OverviewView.vue'),
        meta: { title: 'Overview' },
      },
      {
        path: 'admin',
        name: 'admin',
        component: () => import('@/views/dashboard/AdminView.vue'),
        meta: { title: 'Administration', roles: ['superadmin'] },
      },
    ],
  },

  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/views/ForbiddenView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]
