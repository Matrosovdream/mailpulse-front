<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  archiveWatcher,
  deleteWatcher,
  getWatcher,
  getWatcherStats,
  pauseWatcher,
  restoreWatcher,
  resumeWatcher,
  testWatcher,
  updateWatcher,
} from '@/api/endpoints/watchers'
import { useAction, useAsync } from '@/composables/useAsync'
import { formatDateTime, formatDuration, formatRelative, truncate } from '@/utils/format'
import AppAlert from '@/components/AppAlert.vue'
import AppBadge from '@/components/AppBadge.vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppInput from '@/components/AppInput.vue'
import AppModal from '@/components/AppModal.vue'
import AppSpinner from '@/components/AppSpinner.vue'
import AppTextarea from '@/components/AppTextarea.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import PageHeader from '@/components/PageHeader.vue'
import EventsEditor from './EventsEditor.vue'
import FiltersEditor from './FiltersEditor.vue'
import type { TestWatcherResponse, WatcherStatsResponse } from '@/api/types'

const route = useRoute()
const router = useRouter()
const watcherId = route.params.watcherId as string

const { data: watcher, error, loading, run: reload } = useAsync(() => getWatcher(watcherId))
const action = useAction()

const stats = ref<WatcherStatsResponse | null>(null)
const testResult = ref<TestWatcherResponse | null>(null)
const showingTest = ref(false)
const confirmingDelete = ref(false)

const name = ref('')
const description = ref('')
const folder = ref('')
const cooldown = ref('0')

async function loadAll() {
  const loaded = await reload()
  if (loaded) {
    name.value = loaded.name
    description.value = loaded.description ?? ''
    folder.value = loaded.folder
    cooldown.value = String(loaded.cooldown_seconds)
  }
  getWatcherStats(watcherId, 14).then((s) => (stats.value = s)).catch(() => {})
}

onMounted(loadAll)

async function save() {
  await action.run(
    () =>
      updateWatcher(watcherId, {
        name: name.value,
        description: description.value || null,
        folder: folder.value,
        cooldown_seconds: Number(cooldown.value) || 0,
      }),
    'Saved.',
  )
  await reload()
}

async function lifecycle(fn: (id: string) => Promise<unknown>) {
  await action.run(() => fn(watcherId))
  await reload()
}

async function runTest() {
  const result = await action.run(() => testWatcher(watcherId, 50))
  if (result) {
    testResult.value = result
    showingTest.value = true
  }
}

async function remove() {
  const done = await action.run(() => deleteWatcher(watcherId))
  if (done !== null) await router.push({ name: 'watchers' })
}
</script>

<template>
  <div>
    <div v-if="loading && !watcher" class="flex justify-center py-20 text-muted"><AppSpinner /></div>

    <AppAlert v-else-if="error">{{ error }}</AppAlert>

    <div v-else-if="watcher">
      <PageHeader :title="watcher.name" :subtitle="watcher.description || undefined">
        <template #actions>
          <AppButton variant="secondary" :loading="action.running.value" @click="runTest">
            Test
          </AppButton>
          <AppButton
            v-if="watcher.status === 'active'"
            variant="ghost"
            @click="lifecycle(pauseWatcher)"
          >
            Pause
          </AppButton>
          <AppButton
            v-else-if="watcher.status === 'paused'"
            variant="ghost"
            @click="lifecycle(resumeWatcher)"
          >
            Resume
          </AppButton>
          <AppButton
            v-if="watcher.status === 'archived'"
            variant="ghost"
            @click="lifecycle(restoreWatcher)"
          >
            Restore
          </AppButton>
          <AppButton v-else variant="ghost" @click="lifecycle(archiveWatcher)">Archive</AppButton>
        </template>
      </PageHeader>

      <AppAlert v-if="action.error.value" class="mb-5">{{ action.error.value }}</AppAlert>
      <AppAlert v-if="action.success.value" tone="success" class="mb-5">
        {{ action.success.value }}
      </AppAlert>

      <div class="grid gap-5 lg:grid-cols-3">
        <div class="space-y-5 lg:col-span-2">
          <FiltersEditor
            :watcher-id="watcherId"
            :filters="watcher.filters ?? []"
            :match-mode="watcher.match_mode"
            @saved="reload"
          />

          <EventsEditor
            :watcher-id="watcherId"
            :events="watcher.events ?? []"
            @changed="reload"
          />

          <section class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel">
            <h3 class="mb-4 text-sm font-semibold">Settings</h3>

            <form class="space-y-4" novalidate @submit.prevent="save">
              <AppField v-slot="{ id }" label="Name">
                <AppInput :id="id" v-model="name" required :maxlength="150" />
              </AppField>

              <AppField v-slot="{ id }" label="Description">
                <AppTextarea :id="id" v-model="description" />
              </AppField>

              <AppField v-slot="{ id }" label="Folder">
                <AppInput :id="id" v-model="folder" :maxlength="255" />
              </AppField>

              <AppField
                v-slot="{ id }"
                label="Cooldown (seconds)"
                hint="Suppresses further matches for this long after one fires."
              >
                <AppInput :id="id" v-model="cooldown" type="number" min="0" />
              </AppField>

              <div class="flex justify-end">
                <AppButton type="submit" :loading="action.running.value">Save changes</AppButton>
              </div>
            </form>
          </section>
        </div>

        <div class="space-y-5">
          <section class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel">
            <h3 class="mb-3 text-sm font-semibold">Status</h3>
            <dl class="space-y-2.5 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-muted">State</dt>
                <dd><AppBadge :status="watcher.status" /></dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Mailbox</dt>
                <dd class="truncate font-medium">
                  <RouterLink
                    :to="{ name: 'mail-account', params: { accountId: watcher.mail_account_id } }"
                    class="text-brand-600 hover:text-brand-700"
                  >
                    {{ watcher.mail_account?.email_address ?? 'View' }}
                  </RouterLink>
                </dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Matches</dt>
                <dd class="font-medium">{{ watcher.match_count }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Last match</dt>
                <dd class="font-medium">{{ formatRelative(watcher.last_matched_at) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Cooldown</dt>
                <dd class="font-medium">{{ formatDuration(watcher.cooldown_seconds) }}</dd>
              </div>
            </dl>

            <RouterLink
              :to="{ name: 'matches', query: { watcher_id: watcherId } }"
              class="mt-4 block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View matches →
            </RouterLink>
          </section>

          <section v-if="stats" class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel">
            <h3 class="mb-3 text-sm font-semibold">Last 14 days</h3>
            <dl class="space-y-2.5 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Total matches</dt>
                <dd class="font-medium">{{ stats.total_matches }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Runs succeeded</dt>
                <dd class="font-medium text-emerald-700">{{ stats.runs_succeeded }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Runs failed</dt>
                <dd class="font-medium" :class="stats.runs_failed > 0 && 'text-red-600'">
                  {{ stats.runs_failed }}
                </dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Runs pending</dt>
                <dd class="font-medium">{{ stats.runs_pending }}</dd>
              </div>
            </dl>

            <!-- Sparkline: bar height is relative to the busiest day in range. -->
            <div v-if="stats.daily.length" class="mt-4 flex h-14 items-end gap-0.5">
              <div
                v-for="day in stats.daily"
                :key="day.date"
                class="flex-1 rounded-t bg-brand-200"
                :style="{
                  height: `${Math.max(4, (day.matches / Math.max(...stats.daily.map((d) => d.matches), 1)) * 100)}%`,
                }"
                :title="`${day.date}: ${day.matches}`"
              />
            </div>
          </section>

          <section class="rounded-panel border border-red-200 bg-surface-raised p-5">
            <h3 class="text-sm font-semibold text-red-700">Danger zone</h3>
            <p class="mt-1 mb-3 text-sm text-muted">
              Deleting removes this watcher and its match history.
            </p>
            <AppButton variant="danger" @click="confirmingDelete = true">Delete watcher</AppButton>
          </section>
        </div>
      </div>

      <AppModal v-if="showingTest && testResult" title="Test results" wide @close="showingTest = false">
        <p class="mb-4 text-sm text-muted">
          Scanned {{ testResult.scanned }} recent message(s); {{ testResult.matched }} matched.
          Nothing was dispatched.
        </p>

        <ul v-if="testResult.samples.length" class="divide-y divide-edge">
          <li v-for="(sample, i) in testResult.samples" :key="i" class="py-2.5">
            <div class="flex items-start gap-2">
              <AppBadge :status="sample.matched ? 'succeeded' : 'skipped'">
                {{ sample.matched ? 'Match' : 'No match' }}
              </AppBadge>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ truncate(sample.subject, 70) }}</p>
                <p class="truncate text-xs text-muted">
                  {{ sample.from_address }} · {{ formatDateTime(sample.received_at) }}
                </p>
                <p v-if="sample.matched_filters.length" class="mt-0.5 text-xs text-muted">
                  Matched: {{ sample.matched_filters.join(', ') }}
                </p>
              </div>
            </div>
          </li>
        </ul>

        <p v-else class="text-sm text-muted">No messages were available to scan.</p>
      </AppModal>

      <ConfirmDialog
        v-if="confirmingDelete"
        title="Delete this watcher?"
        :message="`${watcher.name} and its match history will be removed. This cannot be undone.`"
        confirm-label="Delete"
        danger
        :running="action.running.value"
        @close="confirmingDelete = false"
        @confirm="remove"
      />
    </div>
  </div>
</template>
