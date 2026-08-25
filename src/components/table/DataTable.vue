<script setup lang="ts" generic="T">
import AppAlert from '../AppAlert.vue'
import AppSpinner from '../AppSpinner.vue'
import type { PageMetadata } from '@/api/types'

defineProps<{
  columns: { key: string; label: string; class?: string }[]
  rows: T[]
  loading?: boolean
  error?: string
  paging?: PageMetadata
}>()

const emit = defineEmits<{ page: [number] }>()
</script>

<template>
  <div class="overflow-hidden rounded-panel border border-edge bg-surface-raised shadow-panel">
    <AppAlert v-if="error" class="m-4">{{ error }}</AppAlert>

    <div v-else-if="loading && !rows.length" class="flex justify-center py-14 text-muted">
      <AppSpinner />
    </div>

    <slot v-else-if="!rows.length" name="empty">
      <p class="px-6 py-14 text-center text-sm text-muted">Nothing here yet.</p>
    </slot>

    <!-- Wide tables scroll inside this container so the page itself never does. -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-edge bg-surface-sunken">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              class="px-4 py-2.5 font-medium whitespace-nowrap text-muted"
              :class="column.class"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-edge" :class="loading && 'opacity-60'">
          <slot />
        </tbody>
      </table>
    </div>

    <nav
      v-if="paging && paging.total_page > 1"
      class="flex items-center justify-between gap-3 border-t border-edge px-4 py-3 text-sm"
    >
      <p class="text-muted">
        Page {{ paging.page }} of {{ paging.total_page }}
        <span class="hidden sm:inline">· {{ paging.total_item }} total</span>
      </p>

      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 font-medium ring-1 ring-edge ring-inset transition
                 hover:bg-surface-sunken disabled:opacity-40 disabled:hover:bg-transparent"
          :disabled="paging.page <= 1"
          @click="emit('page', paging.page - 1)"
        >
          Previous
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 font-medium ring-1 ring-edge ring-inset transition
                 hover:bg-surface-sunken disabled:opacity-40 disabled:hover:bg-transparent"
          :disabled="paging.page >= paging.total_page"
          @click="emit('page', paging.page + 1)"
        >
          Next
        </button>
      </div>
    </nav>
  </div>
</template>
