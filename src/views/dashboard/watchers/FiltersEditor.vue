<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { listFilterFields } from '@/api/endpoints/catalog'
import { replaceFilters } from '@/api/endpoints/watchers'
import { useAction } from '@/composables/useAsync'
import AppAlert from '@/components/AppAlert.vue'
import AppButton from '@/components/AppButton.vue'
import AppInput from '@/components/AppInput.vue'
import AppSelect from '@/components/AppSelect.vue'
import type {
  FilterField,
  FilterFieldResponse,
  FilterOperator,
  MatchMode,
  WatcherFilterResponse,
} from '@/api/types'

const props = defineProps<{
  watcherId: string
  filters: WatcherFilterResponse[]
  matchMode: MatchMode
}>()

const emit = defineEmits<{ saved: [] }>()

const action = useAction()
const fields = ref<FilterFieldResponse[]>([])

/** Local draft rows. The API replaces the whole set, so it is edited as one. */
interface Draft {
  field: FilterField
  header_name: string
  operator: FilterOperator
  value: string
  case_sensitive: boolean
}

const draft = ref<Draft[]>([])
const mode = ref<MatchMode>(props.matchMode)

function toDraft(filter: WatcherFilterResponse): Draft {
  return {
    field: filter.field,
    header_name: filter.header_name ?? '',
    operator: filter.operator,
    value: filter.value,
    case_sensitive: filter.case_sensitive,
  }
}

watch(
  () => props.filters,
  (next) => (draft.value = next.map(toDraft)),
  { immediate: true },
)

watch(() => props.matchMode, (next) => (mode.value = next))

onMounted(() => {
  listFilterFields().then((f) => (fields.value = f)).catch(() => {})
})

/** Operators valid for a field come from the catalog, not a hard-coded list. */
function operatorsFor(field: FilterField): FilterOperator[] {
  return fields.value.find((f) => f.field === field)?.operators ?? []
}

function add() {
  const first = fields.value[0]
  draft.value = [
    ...draft.value,
    {
      field: first?.field ?? 'subject',
      header_name: '',
      operator: first?.operators?.[0] ?? 'contains',
      value: '',
      case_sensitive: false,
    },
  ]
}

function remove(index: number) {
  draft.value = draft.value.filter((_, i) => i !== index)
}

/** Changing the field can invalidate the operator, so snap it to a valid one. */
function onFieldChange(row: Draft, value: string) {
  row.field = value as FilterField
  const valid = operatorsFor(row.field)
  if (!valid.includes(row.operator) && valid[0]) row.operator = valid[0]
}

const dirty = computed(() => {
  const original = props.filters.map(toDraft)
  return JSON.stringify(original) !== JSON.stringify(draft.value) || mode.value !== props.matchMode
})

async function save() {
  const done = await action.run(
    () =>
      replaceFilters(props.watcherId, {
        match_mode: mode.value,
        filters: draft.value.map((row, index) => ({
          field: row.field,
          header_name: row.field === 'header' ? row.header_name : undefined,
          operator: row.operator,
          value: row.value,
          case_sensitive: row.case_sensitive,
          position: index,
        })),
      }),
    'Filters saved.',
  )
  if (done) emit('saved')
}
</script>

<template>
  <section class="rounded-panel border border-edge bg-surface-raised shadow-panel">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-edge px-5 py-3.5">
      <div>
        <h3 class="text-sm font-semibold">Filters</h3>
        <p class="text-xs text-muted">Conditions a message must satisfy to match.</p>
      </div>
      <AppSelect v-model="mode as string" class="w-44 text-xs">
        <option value="all">Match all filters</option>
        <option value="any">Match any filter</option>
      </AppSelect>
    </header>

    <div class="space-y-3 px-5 py-4">
      <AppAlert v-if="action.error.value">{{ action.error.value }}</AppAlert>
      <AppAlert v-if="action.success.value" tone="success">{{ action.success.value }}</AppAlert>

      <p v-if="!draft.length" class="py-4 text-center text-sm text-muted">
        No filters yet — this watcher matches every message in the folder.
      </p>

      <div
        v-for="(row, index) in draft"
        :key="index"
        class="flex flex-wrap items-start gap-2 rounded-lg bg-surface-sunken p-3"
      >
        <AppSelect
          :model-value="row.field"
          class="w-40"
          aria-label="Field"
          @update:model-value="onFieldChange(row, $event)"
        >
          <option v-for="f in fields" :key="f.field" :value="f.field">{{ f.label }}</option>
        </AppSelect>

        <AppInput
          v-if="row.field === 'header'"
          v-model="row.header_name"
          class="w-40"
          placeholder="Header name"
          aria-label="Header name"
          :maxlength="100"
        />

        <AppSelect v-model="row.operator as string" class="w-36" aria-label="Operator">
          <option v-for="op in operatorsFor(row.field)" :key="op" :value="op">
            {{ op.replace(/_/g, ' ') }}
          </option>
        </AppSelect>

        <AppInput
          v-model="row.value"
          class="min-w-40 flex-1"
          placeholder="Value"
          aria-label="Value"
        />

        <label class="flex items-center gap-1.5 px-1 py-2.5 text-xs whitespace-nowrap text-muted">
          <input v-model="row.case_sensitive" type="checkbox" class="size-3.5 rounded border-edge" />
          Case
        </label>

        <button
          type="button"
          class="rounded-lg p-2.5 text-muted transition hover:bg-red-50 hover:text-red-600"
          aria-label="Remove filter"
          @click="remove(index)"
        >
          <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
            <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="flex flex-wrap justify-between gap-2 pt-1">
        <AppButton variant="secondary" @click="add">Add filter</AppButton>
        <AppButton :disabled="!dirty" :loading="action.running.value" @click="save">
          Save filters
        </AppButton>
      </div>
    </div>
  </section>
</template>
