<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listMailAccounts } from '@/api/endpoints/mailAccounts'
import { createWatcher } from '@/api/endpoints/watchers'
import { useAction, useAsync } from '@/composables/useAsync'
import AppAlert from '@/components/AppAlert.vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppInput from '@/components/AppInput.vue'
import AppModal from '@/components/AppModal.vue'
import AppSelect from '@/components/AppSelect.vue'
import AppSpinner from '@/components/AppSpinner.vue'
import AppTextarea from '@/components/AppTextarea.vue'
import type { MatchMode } from '@/api/types'

const emit = defineEmits<{ close: []; created: [] }>()
const router = useRouter()

const { data: accounts, error: loadError, loading, run } = useAsync(() => listMailAccounts({ size: 100 }))
const action = useAction()

const mailAccountId = ref('')
const name = ref('')
const description = ref('')
const folder = ref('INBOX')
const matchMode = ref<MatchMode>('all')
const cooldown = ref('0')

onMounted(run)

async function submit() {
  const created = await action.run(() =>
    createWatcher({
      mail_account_id: mailAccountId.value,
      name: name.value,
      description: description.value || undefined,
      folder: folder.value || undefined,
      match_mode: matchMode.value,
      // Required by the generated type because the spec gives it a default.
      cooldown_seconds: Number(cooldown.value) || 0,
    }),
  )

  if (created) {
    emit('created')
    // Filters and events are added on the detail page, so go straight there —
    // a watcher with no filters matches nothing and is not finished yet.
    await router.push({ name: 'watcher', params: { watcherId: created.id } })
  }
}
</script>

<template>
  <AppModal title="New watcher" @close="emit('close')">
    <div v-if="loading" class="flex justify-center py-10 text-muted"><AppSpinner /></div>

    <AppAlert v-else-if="loadError">{{ loadError }}</AppAlert>

    <AppAlert v-else-if="!accounts?.items.length" tone="info">
      Connect a mailbox first — a watcher runs against one of your mail accounts.
    </AppAlert>

    <form v-else id="create-watcher" class="space-y-4" novalidate @submit.prevent="submit">
      <AppAlert v-if="action.error.value">{{ action.error.value }}</AppAlert>

      <AppField v-slot="{ id }" label="Mailbox" hint="Cannot be changed after creation.">
        <AppSelect :id="id" v-model="mailAccountId" required>
          <option value="">Select a mailbox…</option>
          <option v-for="account in accounts.items" :key="account.id" :value="account.id">
            {{ account.email_address }}
          </option>
        </AppSelect>
      </AppField>

      <AppField v-slot="{ id }" label="Name">
        <AppInput :id="id" v-model="name" required :maxlength="150" placeholder="Invoices" />
      </AppField>

      <AppField v-slot="{ id }" label="Description (optional)">
        <AppTextarea :id="id" v-model="description" />
      </AppField>

      <AppField v-slot="{ id }" label="Folder">
        <AppInput :id="id" v-model="folder" :maxlength="255" placeholder="INBOX" />
      </AppField>

      <AppField v-slot="{ id }" label="Match mode">
        <AppSelect :id="id" v-model="matchMode as string">
          <option value="all">Match all filters</option>
          <option value="any">Match any filter</option>
        </AppSelect>
      </AppField>

      <AppField
        v-slot="{ id }"
        label="Cooldown (seconds)"
        hint="Suppresses further matches for this long after one fires. 0 disables it."
      >
        <AppInput :id="id" v-model="cooldown" type="number" min="0" />
      </AppField>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">Cancel</AppButton>
      <AppButton
        type="submit"
        form="create-watcher"
        :loading="action.running.value"
        :disabled="!accounts?.items.length"
      >
        Create watcher
      </AppButton>
    </template>
  </AppModal>
</template>
