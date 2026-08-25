<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { listWatchers } from '@/api/endpoints/watchers'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { formatRelative } from '@/utils/format'
import AppBadge from '@/components/AppBadge.vue'
import AppButton from '@/components/AppButton.vue'
import AppInput from '@/components/AppInput.vue'
import AppSelect from '@/components/AppSelect.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/table/DataTable.vue'
import TableCell from '@/components/table/TableCell.vue'
import CreateWatcherModal from './CreateWatcherModal.vue'
import type { WatcherResponse } from '@/api/types'

const { items, paging, loading, error, load, setFilter, goTo } =
  usePaginatedList<WatcherResponse>(listWatchers)

const status = ref('')
const search = ref('')
const creating = ref(false)

const columns = [
  { key: 'name', label: 'Watcher' },
  { key: 'status', label: 'Status' },
  { key: 'folder', label: 'Folder' },
  { key: 'matches', label: 'Matches' },
  { key: 'last', label: 'Last match' },
]

onMounted(load)

let searchTimer: ReturnType<typeof setTimeout> | undefined

// Debounced so typing does not fire a request per keystroke.
function onSearch(value: string) {
  search.value = value
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => setFilter('q', value), 300)
}

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
    <PageHeader title="Watchers" subtitle="Rules that match incoming mail and fire actions.">
      <template #actions>
        <AppInput
          :model-value="search"
          class="w-44"
          type="search"
          placeholder="Search…"
          @update:model-value="onSearch"
        />
        <AppSelect :model-value="status" class="w-36" @update:model-value="onStatus">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </AppSelect>
        <AppButton @click="creating = true">New watcher</AppButton>
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
          title="No watchers yet"
          description="A watcher matches incoming mail against your filters and fires the actions you choose."
        >
          <template #action>
            <AppButton @click="creating = true">New watcher</AppButton>
          </template>
        </EmptyState>
      </template>

      <tr v-for="watcher in items" :key="watcher.id" class="hover:bg-surface-sunken">
        <TableCell>
          <RouterLink
            :to="{ name: 'watcher', params: { watcherId: watcher.id } }"
            class="font-medium text-brand-600 hover:text-brand-700"
          >
            {{ watcher.name }}
          </RouterLink>
          <p v-if="watcher.description" class="max-w-md truncate text-xs text-muted">
            {{ watcher.description }}
          </p>
        </TableCell>
        <TableCell nowrap><AppBadge :status="watcher.status" /></TableCell>
        <TableCell nowrap muted>{{ watcher.folder }}</TableCell>
        <TableCell nowrap muted>{{ watcher.match_count }}</TableCell>
        <TableCell nowrap muted>{{ formatRelative(watcher.last_matched_at) }}</TableCell>
      </tr>
    </DataTable>

    <CreateWatcherModal v-if="creating" @close="creating = false" @created="onCreated" />
  </div>
</template>
