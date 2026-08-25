<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// Placeholder tiles. GET /api/dashboard/summary returns the real rollup and
// gets wired up with the Activity feature work.
const placeholders = [
  { label: 'Mail accounts', hint: 'Connected mailboxes' },
  { label: 'Watchers', hint: 'Active rules' },
  { label: 'Matches today', hint: 'Messages matched' },
  { label: 'Event runs', hint: 'Dispatched actions' },
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold tracking-tight">
        Welcome{{ auth.user?.name ? `, ${auth.user.name}` : '' }}
      </h2>
      <p class="mt-1 text-sm text-muted">
        The foundation is in place. Feature areas land next.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="tile in placeholders"
        :key="tile.label"
        class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel"
      >
        <p class="text-sm font-medium text-muted">{{ tile.label }}</p>
        <p class="mt-2 text-2xl font-semibold tracking-tight text-ink-300">—</p>
        <p class="mt-1 text-xs text-muted">{{ tile.hint }}</p>
      </div>
    </div>

    <div class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel">
      <h3 class="text-sm font-semibold">Session</h3>
      <dl class="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        <div class="flex justify-between gap-4 sm:block">
          <dt class="text-muted">Email</dt>
          <dd class="font-medium sm:mt-0.5">{{ auth.user?.email ?? '—' }}</dd>
        </div>
        <div class="flex justify-between gap-4 sm:block">
          <dt class="text-muted">Roles</dt>
          <dd class="font-medium sm:mt-0.5">{{ auth.roles.join(', ') || '—' }}</dd>
        </div>
        <div class="flex justify-between gap-4 sm:block">
          <dt class="text-muted">Timezone</dt>
          <dd class="font-medium sm:mt-0.5">{{ auth.user?.timezone ?? '—' }}</dd>
        </div>
        <div class="flex justify-between gap-4 sm:block">
          <dt class="text-muted">Session expires</dt>
          <dd class="font-medium sm:mt-0.5">
            {{ auth.expiresAt ? new Date(auth.expiresAt).toLocaleString() : '—' }}
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
