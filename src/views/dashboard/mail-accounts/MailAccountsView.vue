<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { listMailAccounts } from '@/api/endpoints/mailAccounts'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { formatRelative, humanise } from '@/utils/format'
import AppBadge from '@/components/AppBadge.vue'
import AppButton from '@/components/AppButton.vue'
import AppSelect from '@/components/AppSelect.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/table/DataTable.vue'
import TableCell from '@/components/table/TableCell.vue'
import ConnectAccountModal from './ConnectAccountModal.vue'
import type { MailAccountResponse } from '@/api/types'

const { items, paging, loading, error, load, setFilter, goTo } =
  usePaginatedList<MailAccountResponse>(listMailAccounts)

const status = ref('')
const connecting = ref(false)

const columns = [
  { key: 'email', label: 'Mailbox' },
  { key: 'provider', label: 'Provider' },
  { key: 'status', label: 'Status' },
  { key: 'synced', label: 'Last synced' },
  { key: 'next', label: 'Next poll' },
]

onMounted(load)

function onStatus(value: string) {
  status.value = value
  setFilter('status', value)
}

function onConnected() {
  connecting.value = false
  load()
}
</script>

<template>
  <div>
    <PageHeader title="Mail accounts" subtitle="Mailboxes MailPulse watches on your behalf.">
      <template #actions>
        <AppSelect :model-value="status" class="w-40" @update:model-value="onStatus">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="error">Error</option>
          <option value="disabled">Disabled</option>
        </AppSelect>
        <AppButton @click="connecting = true">Connect mailbox</AppButton>
      </template>
    </PageHeader>

    <DataTable
      :columns="columns"
      :rows="items"
      :loading="loading"
      :error="error"
      :paging="paging"
      @page="goTo"
    >
      <template #empty>
        <EmptyState
          title="No mail accounts yet"
          description="Connect a mailbox and MailPulse will start watching it for messages that match your rules."
        >
          <template #action>
            <AppButton @click="connecting = true">Connect mailbox</AppButton>
          </template>
        </EmptyState>
      </template>

      <tr v-for="account in items" :key="account.id" class="hover:bg-surface-sunken">
        <TableCell>
          <RouterLink
            :to="{ name: 'mail-account', params: { accountId: account.id } }"
            class="font-medium text-brand-600 hover:text-brand-700"
          >
            {{ account.email_address }}
          </RouterLink>
          <p v-if="account.display_name" class="text-xs text-muted">{{ account.display_name }}</p>
        </TableCell>
        <TableCell nowrap muted>
          {{ account.provider_label || humanise(account.provider) }}
          <span class="text-xs">· {{ humanise(account.auth_mode) }}</span>
        </TableCell>
        <TableCell nowrap>
          <AppBadge :status="account.status" />
          <p v-if="account.last_error" class="mt-1 max-w-xs truncate text-xs text-red-600">
            {{ account.last_error }}
          </p>
        </TableCell>
        <TableCell nowrap muted>{{ formatRelative(account.last_synced_at) }}</TableCell>
        <TableCell nowrap muted>{{ formatRelative(account.next_poll_at) }}</TableCell>
      </tr>
    </DataTable>

    <ConnectAccountModal
      v-if="connecting"
      @close="connecting = false"
      @connected="onConnected"
    />
  </div>
</template>
