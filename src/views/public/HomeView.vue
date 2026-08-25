<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Placeholder for the public/marketing area. The layout and surface tokens are
// in place so presentation pages can be dropped in without touching the shell.
const auth = useAuthStore()
</script>

<template>
  <section class="mx-auto max-w-3xl px-6 py-24 text-center">
    <h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
      Know the moment mail matters.
    </h1>
    <p class="mx-auto mt-5 max-w-xl text-lg text-pretty text-muted">
      MailPulse watches your mailboxes, matches messages against your filters, and fires the
      actions you choose — notifications, webhooks, HTTP requests.
    </p>

    <div class="mt-9 flex flex-wrap justify-center gap-3">
      <RouterLink
        :to="auth.isAuthenticated ? { name: 'dashboard' } : { name: 'register' }"
        class="rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700"
      >
        {{ auth.isAuthenticated ? 'Go to dashboard' : 'Get started' }}
      </RouterLink>
      <RouterLink
        v-if="!auth.isAuthenticated"
        :to="{ name: 'login' }"
        class="rounded-lg px-5 py-3 text-sm font-medium ring-1 ring-edge ring-inset hover:bg-surface-raised"
      >
        Sign in
      </RouterLink>
    </div>
  </section>
</template>
