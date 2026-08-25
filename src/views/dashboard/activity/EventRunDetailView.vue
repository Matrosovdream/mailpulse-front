<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ackRun, cancelRun, getRun, retryRun } from '@/api/endpoints/activity'
import { useAction, useAsync } from '@/composables/useAsync'
import { formatDateTime, humanise } from '@/utils/format'
import AppAlert from '@/components/AppAlert.vue'
import AppBadge from '@/components/AppBadge.vue'
import AppButton from '@/components/AppButton.vue'
import AppSpinner from '@/components/AppSpinner.vue'
import PageHeader from '@/components/PageHeader.vue'

const route = useRoute()
const runId = route.params.runId as string

const { data: eventRun, error, loading, run: reload } = useAsync(() => getRun(runId))
const action = useAction()

onMounted(reload)

async function retry() {
  await action.run(() => retryRun(runId), 'Re-queued.')
  await reload()
}

async function cancel() {
  const result = await action.run(() => cancelRun(runId))
  if (result) action.success.value = `Cancelled ${result.cancelled} pending run(s).`
  await reload()
}

async function acknowledge() {
  const result = await action.run(() => ackRun(runId))
  if (result) {
    action.success.value = result.cancelled_occurrences
      ? `Acknowledged — ${result.cancelled_occurrences} remaining occurrence(s) cancelled.`
      : 'Acknowledged.'
  }
  await reload()
}
</script>

<template>
  <div>
    <div v-if="loading && !eventRun" class="flex justify-center py-20 text-muted"><AppSpinner /></div>

    <AppAlert v-else-if="error">{{ error }}</AppAlert>

    <div v-else-if="eventRun">
      <PageHeader :title="humanise(eventRun.event_type)" subtitle="Event run">
        <template #actions>
          <AppButton
            v-if="eventRun.status === 'failed'"
            variant="secondary"
            :loading="action.running.value"
            @click="retry"
          >
            Retry
          </AppButton>
          <AppButton
            v-if="eventRun.status === 'pending'"
            variant="secondary"
            :loading="action.running.value"
            @click="cancel"
          >
            Cancel
          </AppButton>
          <AppButton v-if="!eventRun.acknowledged_at" :loading="action.running.value" @click="acknowledge">
            Acknowledge
          </AppButton>
        </template>
      </PageHeader>

      <AppAlert v-if="action.error.value" class="mb-5">{{ action.error.value }}</AppAlert>
      <AppAlert v-if="action.success.value" tone="success" class="mb-5">
        {{ action.success.value }}
      </AppAlert>
      <AppAlert v-if="eventRun.error" class="mb-5">{{ eventRun.error }}</AppAlert>

      <div class="grid gap-5 lg:grid-cols-3">
        <div class="space-y-5 lg:col-span-2">
          <section class="overflow-hidden rounded-panel border border-edge bg-surface-raised shadow-panel">
            <header class="border-b border-edge px-5 py-3.5">
              <h3 class="text-sm font-semibold">Deliveries</h3>
            </header>

            <p v-if="!eventRun.deliveries?.length" class="px-5 py-8 text-center text-sm text-muted">
              No deliveries for this run.
            </p>

            <ul v-else class="divide-y divide-edge">
              <li v-for="delivery in eventRun.deliveries" :key="delivery.id" class="px-5 py-3">
                <div class="flex flex-wrap items-center gap-2 text-sm">
                  <AppBadge :status="delivery.status" />
                  <span class="font-medium">{{ humanise(delivery.channel_type) }}</span>
                  <span class="ml-auto text-xs text-muted">
                    {{ formatDateTime(delivery.sent_at ?? delivery.created_at) }}
                  </span>
                </div>
                <p v-if="delivery.error" class="mt-1 text-xs text-red-600">{{ delivery.error }}</p>
                <pre
                  v-if="delivery.rendered_message"
                  class="mt-2 overflow-x-auto rounded-lg bg-surface-sunken p-3 text-xs whitespace-pre-wrap"
                >{{ delivery.rendered_message }}</pre>
              </li>
            </ul>
          </section>

          <section
            v-if="eventRun.config_snapshot"
            class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel"
          >
            <h3 class="mb-1 text-sm font-semibold">Config snapshot</h3>
            <p class="mb-3 text-xs text-muted">
              The event's configuration when this run was scheduled, so later edits don't rewrite
              history.
            </p>
            <pre class="overflow-x-auto rounded-lg bg-surface-sunken p-3 text-xs">{{
              JSON.stringify(eventRun.config_snapshot, null, 2)
            }}</pre>
          </section>
        </div>

        <section class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel">
          <h3 class="mb-3 text-sm font-semibold">Details</h3>
          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-muted">Status</dt>
              <dd><AppBadge :status="eventRun.status" /></dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-muted">Occurrence</dt>
              <dd class="font-medium">{{ eventRun.occurrence }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-muted">Attempt</dt>
              <dd class="font-medium">{{ eventRun.attempt }} / {{ eventRun.max_attempts }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-muted">Scheduled</dt>
              <dd class="font-medium">{{ formatDateTime(eventRun.scheduled_at) }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-muted">Finished</dt>
              <dd class="font-medium">{{ formatDateTime(eventRun.finished_at) }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-muted">Acknowledged</dt>
              <dd class="font-medium">{{ formatDateTime(eventRun.acknowledged_at) }}</dd>
            </div>
          </dl>

          <RouterLink
            :to="{ name: 'match', params: { matchId: eventRun.matched_email_id } }"
            class="mt-4 block text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View the match →
          </RouterLink>
        </section>
      </div>
    </div>
  </div>
</template>
