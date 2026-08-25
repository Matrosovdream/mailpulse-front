<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { listMatches } from '@/api/endpoints/activity'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { formatBytes, formatRelative, truncate } from '@/utils/format'
import AppInput from '@/components/AppInput.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/table/DataTable.vue'
import TableCell from '@/components/table/TableCell.vue'
import type { MatchedEmailResponse } from '@/api/types'

const route = useRoute()

// A watcher's "View matches" link arrives with the filter already in the query.
const { items, paging, loading, error, load, setFilter, goTo } =
  usePaginatedList<MatchedEmailResponse>(listMatches, {
    filters: {
      watcher_id: typeof route.query.watcher_id === 'string' ? route.query.watcher_id : undefined,
    },
  })

const search = ref('')

const columns = [
  { key: 'subject', label: 'Subject' },
  { key: 'from', label: 'From' },
  { key: 'watcher', label: 'Watcher' },
  { key: 'size', label: 'Size' },
  { key: 'matched', label: 'Matched' },
]

onMounted(load)

let timer: ReturnType<typeof setTimeout> | undefined
function onSearch(value: string) {
  search.value = value
  clearTimeout(timer)
  timer = setTimeout(() => setFilter('q', value), 300)
}
</script>

<template>
  <div>
    <PageHeader title="Matches" subtitle="Messages that satisfied a watcher's filters.">
      <template #actions>
        <AppInput
          :model-value="search"
          class="w-52"
          type="search"
          placeholder="Search subject…"
          @update:model-value="onSearch"
        />
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
          title="No matches yet"
          description="When a watcher matches an incoming message, it appears here."
        />
      </template>

      <tr v-for="match in items" :key="match.id" class="hover:bg-surface-sunken">
        <TableCell>
          <RouterLink
            :to="{ name: 'match', params: { matchId: match.id } }"
            class="font-medium text-brand-600 hover:text-brand-700"
          >
            {{ truncate(match.subject, 60) }}
          </RouterLink>
          <p v-if="match.snippet" class="max-w-md truncate text-xs text-muted">
            {{ match.snippet }}
          </p>
        </TableCell>
        <TableCell muted>
          <span class="block max-w-48 truncate">{{ match.from_name || match.from_address }}</span>
        </TableCell>
        <TableCell nowrap muted>
          <RouterLink
            :to="{ name: 'watcher', params: { watcherId: match.watcher_id } }"
            class="hover:text-body"
          >
            {{ match.watcher_name ?? 'View' }}
          </RouterLink>
        </TableCell>
        <TableCell nowrap muted>{{ formatBytes(match.size_bytes) }}</TableCell>
        <TableCell nowrap muted>{{ formatRelative(match.matched_at) }}</TableCell>
      </tr>
    </DataTable>
  </div>
</template>
