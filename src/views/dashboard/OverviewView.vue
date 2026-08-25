<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getDashboardSummary } from '@/api/endpoints/activity'
import { useAsync } from '@/composables/useAsync'
import { formatRelative, humanise, truncate } from '@/utils/format'
import AppAlert from '@/components/AppAlert.vue'
import AppBadge from '@/components/AppBadge.vue'
import AppSpinner from '@/components/AppSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import type { StatusCounts } from '@/api/types'

const { data: summary, error, loading, run } = useAsync(getDashboardSummary)

onMounted(run)

/** StatusCounts is an open map, so total means summing whatever keys came back. */
function total(counts: StatusCounts | undefined): number {
  if (!counts) return 0
  return Object.values(counts).reduce((sum, n) => sum + n, 0)
}

const tiles = computed(() => [
  {
    label: 'Mail accounts',
    value: total(summary.value?.mail_accounts),
    counts: summary.value?.mail_accounts,
    to: { name: 'mail-accounts' },
  },
  {
    label: 'Watchers',
    value: total(summary.value?.watchers),
    counts: summary.value?.watchers,
    to: { name: 'watchers' },
  },
  {
    label: 'Notifiers',
    value: total(summary.value?.notifiers),
    counts: summary.value?.notifiers,
    to: { name: 'notifiers' },
  },
])
</script>

<template>
  <div>
    <PageHeader title="Overview" subtitle="Your mailboxes, rules and recent activity." />

    <AppAlert v-if="error" class="mb-5">{{ error }}</AppAlert>

    <div v-if="loading && !summary" class="flex justify-center py-20 text-muted">
      <AppSpinner />
    </div>

    <div v-else-if="summary" class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <RouterLink
          v-for="tile in tiles"
          :key="tile.label"
          :to="tile.to"
          class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel transition
                 hover:border-brand-300"
        >
          <p class="text-sm font-medium text-muted">{{ tile.label }}</p>
          <p class="mt-2 text-2xl font-semibold tracking-tight">{{ tile.value }}</p>
          <div class="mt-2 flex flex-wrap gap-1">
            <AppBadge
              v-for="(count, status) in tile.counts ?? {}"
              :key="status"
              :status="String(status)"
            >
              {{ count }}
            </AppBadge>
          </div>
        </RouterLink>

        <div class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel">
          <p class="text-sm font-medium text-muted">Matches, 24h</p>
          <p class="mt-2 text-2xl font-semibold tracking-tight">{{ summary.matches_24h }}</p>
        </div>

        <div class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel">
          <p class="text-sm font-medium text-muted">Failed runs, 24h</p>
          <p
            class="mt-2 text-2xl font-semibold tracking-tight"
            :class="summary.runs_failed_24h > 0 && 'text-red-600'"
          >
            {{ summary.runs_failed_24h }}
          </p>
        </div>
      </div>

      <section class="overflow-hidden rounded-panel border border-edge bg-surface-raised shadow-panel">
        <header class="border-b border-edge px-5 py-3.5">
          <h3 class="text-sm font-semibold">Recent activity</h3>
        </header>

        <EmptyState
          v-if="!summary.recent.length"
          title="No activity yet"
          description="Once a watcher matches a message, it shows up here."
        />

        <ul v-else class="divide-y divide-edge">
          <li
            v-for="item in summary.recent"
            :key="`${item.type}-${item.id}`"
            class="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm"
          >
            <span class="font-medium">{{ humanise(item.type) }}</span>
            <span v-if="item.watcher_name" class="text-muted">{{ item.watcher_name }}</span>
            <span v-if="item.subject" class="min-w-0 flex-1 truncate text-muted">
              {{ truncate(item.subject, 70) }}
            </span>
            <AppBadge v-if="item.status" :status="item.status" />
            <span class="ml-auto text-xs whitespace-nowrap text-muted">
              {{ formatRelative(item.at) }}
            </span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
