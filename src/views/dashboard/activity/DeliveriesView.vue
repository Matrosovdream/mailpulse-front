<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { listDeliveries } from '@/api/endpoints/activity'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { formatRelative, humanise, truncate } from '@/utils/format'
import AppBadge from '@/components/AppBadge.vue'
import AppSelect from '@/components/AppSelect.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/table/DataTable.vue'
import TableCell from '@/components/table/TableCell.vue'
import type { DeliveryResponse } from '@/api/types'

const { items, paging, loading, error, load, setFilter, goTo } =
  usePaginatedList<DeliveryResponse>(listDeliveries)

const status = ref('')

const columns = [
  { key: 'channel', label: 'Channel' },
  { key: 'status', label: 'Status' },
  { key: 'message', label: 'Message' },
  { key: 'sent', label: 'Sent' },
]

onMounted(load)

function onStatus(value: string) {
  status.value = value
  setFilter('status', value)
}
</script>

<template>
  <div>
    <PageHeader title="Deliveries" subtitle="Every attempt to push a run's message through a channel.">
      <template #actions>
        <AppSelect :model-value="status" class="w-40" @update:model-value="onStatus">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </AppSelect>
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
          title="No deliveries yet"
          description="Once an event delivers through a notifier, the attempt is recorded here."
        />
      </template>

      <tr v-for="delivery in items" :key="delivery.id" class="hover:bg-surface-sunken">
        <TableCell nowrap>
          <RouterLink
            :to="{ name: 'event-run', params: { runId: delivery.event_run_id } }"
            class="font-medium text-brand-600 hover:text-brand-700"
          >
            {{ humanise(delivery.channel_type) }}
          </RouterLink>
        </TableCell>
        <TableCell nowrap>
          <AppBadge :status="delivery.status" />
          <p v-if="delivery.error" class="mt-1 max-w-xs truncate text-xs text-red-600">
            {{ delivery.error }}
          </p>
        </TableCell>
        <TableCell muted>
          <span class="block max-w-md truncate">
            {{ truncate(delivery.rendered_message, 90) }}
          </span>
        </TableCell>
        <TableCell nowrap muted>
          {{ formatRelative(delivery.sent_at ?? delivery.created_at) }}
        </TableCell>
      </tr>
    </DataTable>
  </div>
</template>
