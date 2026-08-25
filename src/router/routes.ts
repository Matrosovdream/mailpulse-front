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
        path: 'mail-accounts',
        name: 'mail-accounts',
        component: () => import('@/views/dashboard/mail-accounts/MailAccountsView.vue'),
        meta: { title: 'Mail accounts' },
      },
      {
        path: 'mail-accounts/:accountId',
        name: 'mail-account',
        component: () => import('@/views/dashboard/mail-accounts/MailAccountDetailView.vue'),
        meta: { title: 'Mail account' },
      },

      {
        path: 'watchers',
        name: 'watchers',
        component: () => import('@/views/dashboard/watchers/WatchersView.vue'),
        meta: { title: 'Watchers' },
      },
      {
        path: 'watchers/:watcherId',
        name: 'watcher',
        component: () => import('@/views/dashboard/watchers/WatcherDetailView.vue'),
        meta: { title: 'Watcher' },
      },

      {
        path: 'notifiers',
        name: 'notifiers',
        component: () => import('@/views/dashboard/notifiers/NotifiersView.vue'),
        meta: { title: 'Notifiers' },
      },
      {
        path: 'notifiers/:notifierId',
        name: 'notifier',
        component: () => import('@/views/dashboard/notifiers/NotifierDetailView.vue'),
        meta: { title: 'Notifier' },
      },

      {
        path: 'matches',
        name: 'matches',
        component: () => import('@/views/dashboard/activity/MatchesView.vue'),
        meta: { title: 'Matches' },
      },
      {
        path: 'matches/:matchId',
        name: 'match',
        component: () => import('@/views/dashboard/activity/MatchDetailView.vue'),
        meta: { title: 'Match' },
      },
      {
        path: 'event-runs',
        name: 'event-runs',
        component: () => import('@/views/dashboard/activity/EventRunsView.vue'),
        meta: { title: 'Event runs' },
      },
      {
        path: 'event-runs/:runId',
        name: 'event-run',
        component: () => import('@/views/dashboard/activity/EventRunDetailView.vue'),
        meta: { title: 'Event run' },
      },
      {
        path: 'deliveries',
        name: 'deliveries',
        component: () => import('@/views/dashboard/activity/DeliveriesView.vue'),
        meta: { title: 'Deliveries' },
      },

      {
        path: 'account',
        name: 'account',
        component: () => import('@/views/dashboard/AccountView.vue'),
        meta: { title: 'Account' },
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
