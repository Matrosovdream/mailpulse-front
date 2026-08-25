<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { listRuns } from '@/api/endpoints/activity'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { formatRelative, humanise } from '@/utils/format'
import AppBadge from '@/components/AppBadge.vue'
import AppSelect from '@/components/AppSelect.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/table/DataTable.vue'
import TableCell from '@/components/table/TableCell.vue'
import type { EventRunResponse } from '@/api/types'

const { items, paging, loading, error, load, setFilter, goTo } =
  usePaginatedList<EventRunResponse>(listRuns)

const status = ref('')

const columns = [
  { key: 'type', label: 'Action' },
  { key: 'status', label: 'Status' },
  { key: 'attempt', label: 'Attempt' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'finished', label: 'Finished' },
]

onMounted(load)

function onStatus(value: string) {
  status.value = value
  setFilter('status', value)
}
</script>

<template>
  <div>
    <PageHeader title="Event runs" subtitle="Each execution of a watcher event against a match.">
      <template #actions>
        <AppSelect :model-value="status" class="w-40" @update:model-value="onStatus">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="succeeded">Succeeded</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="skipped">Skipped</option>
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
          title="No event runs yet"
          description="When a watcher matches a message and fires an event, the run shows up here."
        />
      </template>

      <tr v-for="eventRun in items" :key="eventRun.id" class="hover:bg-surface-sunken">
        <TableCell>
          <RouterLink
            :to="{ name: 'event-run', params: { runId: eventRun.id } }"
            class="font-medium text-brand-600 hover:text-brand-700"
          >
            {{ humanise(eventRun.event_type) }}
          </RouterLink>
          <span v-if="eventRun.occurrence > 1" class="ml-1.5 text-xs text-muted">
            #{{ eventRun.occurrence }}
          </span>
        </TableCell>
        <TableCell nowrap>
          <AppBadge :status="eventRun.status" />
          <p v-if="eventRun.error" class="mt-1 max-w-xs truncate text-xs text-red-600">
            {{ eventRun.error }}
          </p>
        </TableCell>
        <TableCell nowrap muted>{{ eventRun.attempt }} / {{ eventRun.max_attempts }}</TableCell>
        <TableCell nowrap muted>{{ formatRelative(eventRun.scheduled_at) }}</TableCell>
        <TableCell nowrap muted>{{ formatRelative(eventRun.finished_at) }}</TableCell>
      </tr>
    </DataTable>
  </div>
</template>
