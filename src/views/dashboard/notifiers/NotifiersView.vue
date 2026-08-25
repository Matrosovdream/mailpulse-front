<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { listNotifiers } from '@/api/endpoints/notifiers'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { formatRelative, humanise } from '@/utils/format'
import AppBadge from '@/components/AppBadge.vue'
import AppButton from '@/components/AppButton.vue'
import AppSelect from '@/components/AppSelect.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/table/DataTable.vue'
import TableCell from '@/components/table/TableCell.vue'
import CreateNotifierModal from './CreateNotifierModal.vue'
import type { NotifierResponse } from '@/api/types'

const { items, paging, loading, error, load, setFilter, goTo } =
  usePaginatedList<NotifierResponse>(listNotifiers)

const status = ref('')
const creating = ref(false)

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Channel' },
  { key: 'status', label: 'Status' },
  { key: 'verified', label: 'Verified' },
]

onMounted(load)

function onStatus(value: string) {
  status.value = value
  setFilter('status', value)
}

function onCreated() {
  creating.value = false
  load()
}
</script>

<template>
  <div>
    <PageHeader title="Notifiers" subtitle="Channels your watchers deliver through.">
      <template #actions>
        <AppSelect :model-value="status" class="w-40" @update:model-value="onStatus">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="error">Error</option>
          <option value="disabled">Disabled</option>
        </AppSelect>
        <AppButton @click="creating = true">Add notifier</AppButton>
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
          title="No notifiers yet"
          description="Add a channel — Telegram, Slack, email, webhook — and your watchers can deliver through it."
        >
          <template #action>
            <AppButton @click="creating = true">Add notifier</AppButton>
          </template>
        </EmptyState>
      </template>

      <tr v-for="notifier in items" :key="notifier.id" class="hover:bg-surface-sunken">
        <TableCell>
          <RouterLink
            :to="{ name: 'notifier', params: { notifierId: notifier.id } }"
            class="font-medium text-brand-600 hover:text-brand-700"
          >
            {{ notifier.name }}
          </RouterLink>
          <span
            v-if="notifier.is_default"
            class="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700"
          >
            Default
          </span>
        </TableCell>
        <TableCell nowrap muted>{{ humanise(notifier.type) }}</TableCell>
        <TableCell nowrap>
          <AppBadge :status="notifier.status" />
          <p v-if="notifier.last_error" class="mt-1 max-w-xs truncate text-xs text-red-600">
            {{ notifier.last_error }}
          </p>
        </TableCell>
        <TableCell nowrap muted>{{ formatRelative(notifier.verified_at) }}</TableCell>
      </tr>
    </DataTable>

    <CreateNotifierModal v-if="creating" @close="creating = false" @created="onCreated" />
  </div>
</template>
