<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listNotifierTypes } from '@/api/endpoints/catalog'
import {
  deleteNotifier,
  getNotifier,
  testNotifier,
  updateNotifier,
  verifyNotifier,
} from '@/api/endpoints/notifiers'
import { useAction, useAsync } from '@/composables/useAsync'
import { formatRelative, humanise } from '@/utils/format'
import AppAlert from '@/components/AppAlert.vue'
import AppBadge from '@/components/AppBadge.vue'
import AppButton from '@/components/AppButton.vue'
import AppCheckbox from '@/components/AppCheckbox.vue'
import AppField from '@/components/AppField.vue'
import AppInput from '@/components/AppInput.vue'
import AppSpinner from '@/components/AppSpinner.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ConfigSchemaForm from '@/components/form/ConfigSchemaForm.vue'
import PageHeader from '@/components/PageHeader.vue'
import type { JSONObject, NotifierTypeResponse } from '@/api/types'

const route = useRoute()
const router = useRouter()
const notifierId = route.params.notifierId as string

const { data: notifier, error, loading, run: reload } = useAsync(() => getNotifier(notifierId))
const action = useAction()

const types = ref<NotifierTypeResponse[]>([])
const name = ref('')
const isDefault = ref(false)
const config = ref<JSONObject>({})
const secrets = ref<JSONObject>({})
const verificationCode = ref('')
const codeToEnter = ref('')
const confirmingDelete = ref(false)

const schema = computed(
  () => types.value.find((t) => t.type === notifier.value?.type)?.config_schema,
)

onMounted(async () => {
  const loaded = await reload()
  if (loaded) {
    name.value = loaded.name
    isDefault.value = loaded.is_default
    config.value = { ...(loaded.config ?? {}) }
  }
  listNotifierTypes().then((t) => (types.value = t)).catch(() => {})
})

async function save() {
  await action.run(
    () =>
      updateNotifier(notifierId, {
        name: name.value,
        is_default: isDefault.value,
        config: Object.keys(config.value).length ? config.value : undefined,
        // Secrets are never returned, so an untouched form must not overwrite
        // the stored values with an empty object.
        secrets: Object.keys(secrets.value).length ? secrets.value : undefined,
      }),
    'Saved.',
  )
  secrets.value = {}
  await reload()
}

/**
 * Verification is two calls: the first, with no code, has the server issue one
 * for the user to send to the channel; the second confirms the code they got
 * back out of band.
 */
async function requestCode() {
  const result = await action.run(() => verifyNotifier(notifierId))
  if (result) {
    verificationCode.value = result.verification_code ?? ''
    action.success.value = result.message
  }
  await reload()
}

async function confirmCode() {
  const result = await action.run(() => verifyNotifier(notifierId, codeToEnter.value))
  if (result) action.success.value = result.message
  codeToEnter.value = ''
  verificationCode.value = ''
  await reload()
}

async function sendTest() {
  const result = await action.run(() => testNotifier(notifierId))
  if (result) {
    action.success.value = result.delivered
      ? `Delivered${result.provider_message_id ? ` (${result.provider_message_id})` : ''}.`
      : ''
    if (!result.delivered) action.error.value = result.error || 'The channel did not accept it.'
  }
}

async function toggleEnabled() {
  const next = notifier.value?.status === 'disabled' ? 'verified' : 'disabled'
  await action.run(() => updateNotifier(notifierId, { status: next }), 'Saved.')
  await reload()
}

async function remove() {
  const done = await action.run(() => deleteNotifier(notifierId))
  if (done !== null) await router.push({ name: 'notifiers' })
}
</script>

<template>
  <div>
    <div v-if="loading && !notifier" class="flex justify-center py-20 text-muted"><AppSpinner /></div>

    <AppAlert v-else-if="error">{{ error }}</AppAlert>

    <div v-else-if="notifier">
      <PageHeader :title="notifier.name" :subtitle="humanise(notifier.type)">
        <template #actions>
          <AppButton variant="secondary" :loading="action.running.value" @click="sendTest">
            Send test
          </AppButton>
          <AppButton variant="ghost" @click="toggleEnabled">
            {{ notifier.status === 'disabled' ? 'Enable' : 'Disable' }}
          </AppButton>
        </template>
      </PageHeader>

      <AppAlert v-if="action.error.value" class="mb-5">{{ action.error.value }}</AppAlert>
      <AppAlert v-if="action.success.value" tone="success" class="mb-5">
        {{ action.success.value }}
      </AppAlert>
      <AppAlert v-if="notifier.last_error" class="mb-5">{{ notifier.last_error }}</AppAlert>

      <div class="grid gap-5 lg:grid-cols-3">
        <section class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel lg:col-span-2">
          <h3 class="mb-4 text-sm font-semibold">Settings</h3>

          <form class="space-y-4" novalidate @submit.prevent="save">
            <AppField v-slot="{ id }" label="Name">
              <AppInput :id="id" v-model="name" required :maxlength="100" />
            </AppField>

            <ConfigSchemaForm
              v-model:config="config"
              v-model:secrets="secrets"
              :schema="schema"
              editing
            />

            <AppCheckbox
              v-model="isDefault"
              label="Default notifier"
              hint="Used by events that name no notifier. Clears the flag on your others."
            />

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
                <dd><AppBadge :status="notifier.status" /></dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Verified</dt>
                <dd class="font-medium">{{ formatRelative(notifier.verified_at) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Default</dt>
                <dd class="font-medium">{{ notifier.is_default ? 'Yes' : 'No' }}</dd>
              </div>
            </dl>
          </section>

          <section
            v-if="notifier.status !== 'verified'"
            class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel"
          >
            <h3 class="text-sm font-semibold">Verify this channel</h3>
            <p class="mt-1 text-sm text-muted">
              Request a code, send it to the channel, then confirm it here.
            </p>

            <div
              v-if="verificationCode"
              class="my-3 rounded-lg bg-surface-sunken px-3 py-2.5 text-center font-mono text-lg font-semibold"
            >
              {{ verificationCode }}
            </div>

            <div class="mt-3 space-y-3">
              <AppButton
                variant="secondary"
                block
                :loading="action.running.value"
                @click="requestCode"
              >
                Request a code
              </AppButton>

              <form class="space-y-2" novalidate @submit.prevent="confirmCode">
                <AppField v-slot="{ id }" label="Code you received">
                  <AppInput :id="id" v-model="codeToEnter" :maxlength="20" placeholder="123456" />
                </AppField>
                <AppButton
                  type="submit"
                  block
                  :disabled="!codeToEnter"
                  :loading="action.running.value"
                >
                  Confirm
                </AppButton>
              </form>
            </div>
          </section>

          <section class="rounded-panel border border-red-200 bg-surface-raised p-5">
            <h3 class="text-sm font-semibold text-red-700">Danger zone</h3>
            <p class="mt-1 mb-3 text-sm text-muted">
              Events delivering through this notifier will stop.
            </p>
            <AppButton variant="danger" @click="confirmingDelete = true">Delete notifier</AppButton>
          </section>
        </div>
      </div>

      <ConfirmDialog
        v-if="confirmingDelete"
        title="Delete this notifier?"
        :message="`${notifier.name} will be removed and any event using it will stop delivering.`"
        confirm-label="Delete"
        danger
        :running="action.running.value"
        @close="confirmingDelete = false"
        @confirm="remove"
      />
    </div>
  </div>
</template>
