<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getMatch } from '@/api/endpoints/activity'
import { useAsync } from '@/composables/useAsync'
import { formatBytes, formatDateTime, humanise } from '@/utils/format'
import AppAlert from '@/components/AppAlert.vue'
import AppBadge from '@/components/AppBadge.vue'
import AppSpinner from '@/components/AppSpinner.vue'
import PageHeader from '@/components/PageHeader.vue'

const route = useRoute()
const matchId = route.params.matchId as string

const { data: match, error, loading, run } = useAsync(() => getMatch(matchId))

onMounted(run)
</script>

<template>
  <div>
    <div v-if="loading && !match" class="flex justify-center py-20 text-muted"><AppSpinner /></div>

    <AppAlert v-else-if="error">{{ error }}</AppAlert>

    <div v-else-if="match">
      <PageHeader :title="match.subject || '(no subject)'" />

      <div class="grid gap-5 lg:grid-cols-3">
        <div class="space-y-5 lg:col-span-2">
          <section class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel">
            <h3 class="mb-3 text-sm font-semibold">Message</h3>
            <dl class="space-y-2.5 text-sm">
              <div>
                <dt class="text-muted">From</dt>
                <dd class="font-medium">
                  {{ match.from_name ? `${match.from_name} <${match.from_address}>` : match.from_address }}
                </dd>
              </div>
              <div v-if="match.to_addresses">
                <dt class="text-muted">To</dt>
                <dd class="font-medium break-words">{{ match.to_addresses }}</dd>
              </div>
              <div v-if="match.snippet">
                <dt class="text-muted">Preview</dt>
                <dd class="mt-1 rounded-lg bg-surface-sunken p-3 text-sm whitespace-pre-wrap">
                  {{ match.snippet }}
                </dd>
              </div>
            </dl>
          </section>

          <section class="overflow-hidden rounded-panel border border-edge bg-surface-raised shadow-panel">
            <header class="border-b border-edge px-5 py-3.5">
              <h3 class="text-sm font-semibold">Event runs</h3>
            </header>

            <p v-if="!match.runs?.length" class="px-5 py-8 text-center text-sm text-muted">
              This match triggered no events.
            </p>

            <ul v-else class="divide-y divide-edge">
              <li
                v-for="eventRun in match.runs"
                :key="eventRun.id"
                class="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"
              >
                <AppBadge :status="eventRun.status" />
                <RouterLink
                  :to="{ name: 'event-run', params: { runId: eventRun.id } }"
                  class="font-medium text-brand-600 hover:text-brand-700"
                >
                  {{ humanise(eventRun.event_type) }}
                </RouterLink>
                <span v-if="eventRun.occurrence > 1" class="text-xs text-muted">
                  occurrence {{ eventRun.occurrence }}
                </span>
                <span class="ml-auto text-xs text-muted">
                  {{ formatDateTime(eventRun.scheduled_at) }}
                </span>
              </li>
            </ul>
          </section>
        </div>

        <section class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel">
          <h3 class="mb-3 text-sm font-semibold">Details</h3>
          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-muted">Watcher</dt>
              <dd class="truncate font-medium">
                <RouterLink
                  :to="{ name: 'watcher', params: { watcherId: match.watcher_id } }"
                  class="text-brand-600 hover:text-brand-700"
                >
                  {{ match.watcher_name ?? 'View' }}
                </RouterLink>
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-muted">Received</dt>
              <dd class="font-medium">{{ formatDateTime(match.received_at) }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-muted">Matched</dt>
              <dd class="font-medium">{{ formatDateTime(match.matched_at) }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-muted">Size</dt>
              <dd class="font-medium">{{ formatBytes(match.size_bytes) }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-muted">Attachment</dt>
              <dd class="font-medium">{{ match.has_attachment ? 'Yes' : 'No' }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  </div>
</template>
