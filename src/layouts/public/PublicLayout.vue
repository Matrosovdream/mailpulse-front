<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Reserved for marketing and presentation pages. Deliberately thin for now —
// the shell exists so public routes have somewhere to land.
const auth = useAuthStore()
</script>

<template>
  <div data-surface="public" class="flex min-h-dvh flex-col bg-surface text-body">
    <header class="border-b border-edge">
      <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <RouterLink :to="{ name: 'home' }" class="flex items-center gap-2.5">
          <span class="grid size-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            M
          </span>
          <span class="font-semibold tracking-tight">MailPulse</span>
        </RouterLink>

        <nav class="flex items-center gap-2 text-sm">
          <RouterLink
            v-if="auth.isAuthenticated"
            :to="{ name: 'dashboard' }"
            class="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
          >
            Dashboard
          </RouterLink>
          <template v-else>
            <RouterLink :to="{ name: 'login' }" class="rounded-lg px-3 py-2 font-medium text-muted hover:text-body">
              Sign in
            </RouterLink>
            <RouterLink
              :to="{ name: 'register' }"
              class="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
            >
              Get started
            </RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="border-t border-edge">
      <div class="mx-auto max-w-5xl px-6 py-8 text-sm text-muted">
        &copy; {{ new Date().getFullYear() }} MailPulse
      </div>
    </footer>
  </div>
</template>
