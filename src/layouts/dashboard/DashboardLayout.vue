<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { visibleNavigation } from '@/router/navigation'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

// Filtered per role. Cosmetic only — the route meta and the API both enforce.
const sections = computed(() => visibleNavigation(auth.roles))
const title = computed(() => route.meta.title ?? 'Dashboard')

const menuOpen = ref(false)
const signingOut = ref(false)

async function signOut() {
  signingOut.value = true
  try {
    await auth.logout()
    await router.push({ name: 'login' })
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <div data-surface="dashboard" class="min-h-dvh bg-surface text-body">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-edge bg-surface-raised
             transition-transform lg:translate-x-0"
      :class="menuOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-16 shrink-0 items-center gap-2.5 border-b border-edge px-5">
        <span class="grid size-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          M
        </span>
        <span class="font-semibold tracking-tight">MailPulse</span>
      </div>

      <nav class="flex-1 space-y-6 overflow-y-auto p-4">
        <div v-for="section in sections" :key="section.label">
          <p class="px-2.5 pb-2 text-xs font-semibold tracking-wider text-muted uppercase">
            {{ section.label }}
          </p>
          <ul class="space-y-0.5">
            <li v-for="item in section.items" :key="item.label">
              <!--
                Resolved through the slot rather than active-class: the active
                and inactive styles set the same properties, so leaving both
                classes applied would let CSS source order decide the winner.
              -->
              <RouterLink v-slot="{ href, navigate, isExactActive }" :to="item.to" custom>
                <a
                  :href="href"
                  :aria-current="isExactActive ? 'page' : undefined"
                  class="block rounded-lg px-2.5 py-2 text-sm font-medium transition"
                  :class="
                    isExactActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-muted hover:bg-surface-sunken hover:text-body'
                  "
                  @click="navigate($event); menuOpen = false"
                >
                  {{ item.label }}
                </a>
              </RouterLink>
            </li>
          </ul>
        </div>
      </nav>

      <div class="shrink-0 border-t border-edge p-4">
        <div class="mb-3 px-1">
          <p class="truncate text-sm font-medium">{{ auth.user?.name || auth.user?.email }}</p>
          <p class="truncate text-xs text-muted">
            {{ auth.isSuperadmin ? 'Superadmin' : 'User' }}
          </p>
        </div>
        <button
          type="button"
          :disabled="signingOut"
          class="w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium text-muted transition
                 hover:bg-surface-sunken hover:text-body disabled:opacity-60"
          @click="signOut"
        >
          {{ signingOut ? 'Signing out…' : 'Sign out' }}
        </button>
      </div>
    </aside>

    <!-- Backdrop, mobile only -->
    <div
      v-if="menuOpen"
      class="fixed inset-0 z-30 bg-ink-900/20 lg:hidden"
      @click="menuOpen = false"
    />

    <div class="lg:pl-64">
      <header
        class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-edge bg-surface-raised px-5"
      >
        <button
          type="button"
          class="-ml-1 rounded-lg p-2 text-muted hover:bg-surface-sunken hover:text-body lg:hidden"
          aria-label="Open navigation"
          @click="menuOpen = true"
        >
          <svg class="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
            <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke-linecap="round" />
          </svg>
        </button>

        <h1 class="text-base font-semibold tracking-tight">{{ title }}</h1>
      </header>

      <main class="p-5 lg:p-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>
