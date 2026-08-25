<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  deleteMailAccount,
  getMailAccount,
  listFolders,
  listSyncRuns,
  syncMailAccount,
  updateMailAccount,
  verifyMailAccount,
} from '@/api/endpoints/mailAccounts'
import { useAction, useAsync } from '@/composables/useAsync'
import { formatDateTime, formatDuration, formatRelative, humanise } from '@/utils/format'
import AppAlert from '@/components/AppAlert.vue'
import AppBadge from '@/components/AppBadge.vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppInput from '@/components/AppInput.vue'
import AppSpinner from '@/components/AppSpinner.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import PageHeader from '@/components/PageHeader.vue'
import type { FolderResponse, MailSyncRunResponse } from '@/api/types'

const route = useRoute()
const router = useRouter()
const accountId = route.params.accountId as string

const { data: account, error, loading, run: reload } = useAsync(() => getMailAccount(accountId))
const action = useAction()

const folders = ref<FolderResponse[]>([])
const syncRuns = ref<MailSyncRunResponse[]>([])
const displayName = ref('')
const pollInterval = ref('')
const password = ref('')
const confirmingDelete = ref(false)

onMounted(async () => {
  const loaded = await reload()
  if (loaded) {
    displayName.value = loaded.display_name ?? ''
    pollInterval.value = String(loaded.poll_interval_seconds)
  }
  // Folders need a live connection, so an unverified account will fail here.
  // That is not an error worth showing on the page — the status already says so.
  listFolders(accountId).then((f) => (folders.value = f)).catch(() => {})
  listSyncRuns(accountId, { size: 5 }).then((p) => (syncRuns.value = p.items)).catch(() => {})
})

async function verify() {
  await action.run(() => verifyMailAccount(accountId), 'Credentials verified.')
  await reload()
  listFolders(accountId).then((f) => (folders.value = f)).catch(() => {})
}

async function syncNow() {
  const result = await action.run(() => syncMailAccount(accountId))
  if (result) {
    action.success.value = `Fetched ${result.messages_fetched} message(s), created ${result.matches_created} match(es).`
  }
  await reload()
  listSyncRuns(accountId, { size: 5 }).then((p) => (syncRuns.value = p.items)).catch(() => {})
}

async function save() {
  const interval = Number(pollInterval.value)
  await action.run(
    () =>
      updateMailAccount(accountId, {
        display_name: displayName.value || undefined,
        poll_interval_seconds: Number.isFinite(interval) ? interval : undefined,
        // Sending a new password re-encrypts the credential and resets the
        // account to pending, so only send it when the user typed one.
        password: password.value || undefined,
      }),
    'Saved.',
  )
  password.value = ''
  await reload()
}

async function toggleEnabled() {
  const next = account.value?.status === 'disabled' ? 'verified' : 'disabled'
  await action.run(() => updateMailAccount(accountId, { status: next }), 'Saved.')
  await reload()
}

async function remove() {
  const done = await action.run(() => deleteMailAccount(accountId))
  if (done !== null) await router.push({ name: 'mail-accounts' })
}
</script>

<template>
  <div>
    <div v-if="loading && !account" class="flex justify-center py-20 text-muted"><AppSpinner /></div>

    <AppAlert v-else-if="error">{{ error }}</AppAlert>

    <div v-else-if="account">
      <PageHeader :title="account.email_address" :subtitle="account.provider_label || humanise(account.provider)">
        <template #actions>
          <AppButton variant="secondary" :loading="action.running.value" @click="verify">
            Verify
          </AppButton>
          <AppButton variant="secondary" :loading="action.running.value" @click="syncNow">
            Sync now
          </AppButton>
          <AppButton variant="ghost" @click="toggleEnabled">
            {{ account.status === 'disabled' ? 'Enable' : 'Disable' }}
          </AppButton>
        </template>
      </PageHeader>

      <AppAlert v-if="action.error.value" class="mb-5">{{ action.error.value }}</AppAlert>
      <AppAlert v-if="action.success.value" tone="success" class="mb-5">
        {{ action.success.value }}
      </AppAlert>
      <AppAlert v-if="account.last_error" class="mb-5">{{ account.last_error }}</AppAlert>

      <div class="grid gap-5 lg:grid-cols-3">
        <section class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel lg:col-span-2">
          <h3 class="mb-4 text-sm font-semibold">Settings</h3>

          <form class="space-y-4" novalidate @submit.prevent="save">
            <AppField v-slot="{ id }" label="Display name">
              <AppInput :id="id" v-model="displayName" :maxlength="150" />
            </AppField>

            <AppField
              v-slot="{ id }"
              label="Poll interval (seconds)"
              hint="How often the worker checks this mailbox. Between 30 and 86400."
            >
              <AppInput :id="id" v-model="pollInterval" type="number" min="30" max="86400" />
            </AppField>

            <AppField
              v-slot="{ id }"
              label="Password"
              hint="Leave blank to keep the stored credential. Changing it resets the account to pending."
            >
              <AppInput
                :id="id"
                v-model="password"
                type="password"
                autocomplete="new-password"
                :maxlength="255"
              />
            </AppField>

            <div class="flex justify-end">
              <AppButton type="submit" :loading="action.running.value">Save changes</AppButton>
            </div>
          </form>
        </section>

        <div class="space-y-5">
          <section class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel">
            <h3 class="mb-3 text-sm font-semibold">Status</h3>
            <dl class="space-y-2.5 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-muted">State</dt>
                <dd><AppBadge :status="account.status" /></dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Auth mode</dt>
                <dd class="font-medium">{{ humanise(account.auth_mode) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Last verified</dt>
                <dd class="font-medium">{{ formatRelative(account.last_verified_at) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Last synced</dt>
                <dd class="font-medium">{{ formatRelative(account.last_synced_at) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Next poll</dt>
                <dd class="font-medium">{{ formatRelative(account.next_poll_at) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Interval</dt>
                <dd class="font-medium">{{ formatDuration(account.poll_interval_seconds) }}</dd>
              </div>
            </dl>
          </section>

          <section
            v-if="folders.length"
            class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel"
          >
            <h3 class="mb-3 text-sm font-semibold">Folders</h3>
            <ul class="space-y-1.5 text-sm">
              <li v-for="folder in folders" :key="folder.name" class="flex justify-between gap-3">
                <span class="truncate">{{ folder.name }}</span>
                <span class="text-muted">{{ folder.message_count }}</span>
              </li>
            </ul>
          </section>

          <section
            v-if="syncRuns.length"
            class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel"
          >
            <h3 class="mb-3 text-sm font-semibold">Recent syncs</h3>
            <ul class="space-y-2.5 text-sm">
              <li v-for="syncRun in syncRuns" :key="syncRun.id" class="flex items-center gap-2">
                <AppBadge :status="syncRun.status" />
                <span class="text-muted">{{ syncRun.messages_fetched }} fetched</span>
                <span class="ml-auto text-xs text-muted">
                  {{ formatDateTime(syncRun.started_at) }}
                </span>
              </li>
            </ul>
          </section>

          <section class="rounded-panel border border-red-200 bg-surface-raised p-5">
            <h3 class="text-sm font-semibold text-red-700">Danger zone</h3>
            <p class="mt-1 mb-3 text-sm text-muted">
              Deleting this mailbox also removes its watchers and their history.
            </p>
            <AppButton variant="danger" @click="confirmingDelete = true">Delete mailbox</AppButton>
          </section>
        </div>
      </div>

      <ConfirmDialog
        v-if="confirmingDelete"
        title="Delete this mailbox?"
        :message="`${account.email_address} and every watcher on it will be removed. This cannot be undone.`"
        confirm-label="Delete"
        danger
        :running="action.running.value"
        @close="confirmingDelete = false"
        @confirm="remove"
      />
    </div>
  </div>
</template>
