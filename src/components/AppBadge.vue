<script setup lang="ts">
import { computed } from 'vue'
import { humanise } from '@/utils/format'

const props = defineProps<{ status?: string }>()

/**
 * Status pill. One mapping for every status enum in the API — they share
 * vocabulary (`pending`, `verified`, `error`, `disabled`, `failed`, …), so a
 * single lookup keeps a "failed" run and a "failed" delivery looking alike.
 */
const tones: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  verified: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  succeeded: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  sent: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-200',

  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  running: 'bg-blue-50 text-blue-700 ring-blue-200',
  paused: 'bg-amber-50 text-amber-700 ring-amber-200',

  error: 'bg-red-50 text-red-700 ring-red-200',
  failed: 'bg-red-50 text-red-700 ring-red-200',

  disabled: 'bg-ink-100 text-ink-600 ring-ink-200',
  archived: 'bg-ink-100 text-ink-600 ring-ink-200',
  cancelled: 'bg-ink-100 text-ink-600 ring-ink-200',
  skipped: 'bg-ink-100 text-ink-600 ring-ink-200',
}

const tone = computed(() => tones[props.status ?? ''] ?? 'bg-ink-100 text-ink-600 ring-ink-200')
</script>

<template>
  <span
    class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap"
    :class="tone"
  >
    {{ humanise(status) }}
  </span>
</template>
