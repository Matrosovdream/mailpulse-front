<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { listEventTypes } from '@/api/endpoints/catalog'
import { listNotifiers } from '@/api/endpoints/notifiers'
import {
  createEvent,
  deleteEvent,
  reorderEvents,
  testEvent,
  updateEvent,
} from '@/api/endpoints/watcherEvents'
import { useAction } from '@/composables/useAsync'
import { formatDuration, humanise } from '@/utils/format'
import AppAlert from '@/components/AppAlert.vue'
import AppButton from '@/components/AppButton.vue'
import AppCheckbox from '@/components/AppCheckbox.vue'
import AppField from '@/components/AppField.vue'
import AppInput from '@/components/AppInput.vue'
import AppModal from '@/components/AppModal.vue'
import AppSelect from '@/components/AppSelect.vue'
import ConfigSchemaForm from '@/components/form/ConfigSchemaForm.vue'
import { missingRequiredFields } from '@/components/form/validation'
import type {
  EventTypeResponse,
  JSONObject,
  NotifierResponse,
  RunMode,
  WatcherEventResponse,
} from '@/api/types'

const props = defineProps<{ watcherId: string; events: WatcherEventResponse[] }>()
const emit = defineEmits<{ changed: [] }>()

const action = useAction()
const types = ref<EventTypeResponse[]>([])
const notifiers = ref<NotifierResponse[]>([])

const editing = ref<WatcherEventResponse | null>(null)
const adding = ref(false)

// Form state, shared by the add and edit dialogs.
const typeSlug = ref('')
const config = ref<JSONObject>({})
const secrets = ref<JSONObject>({})
const runMode = ref<RunMode>('immediate')
const delaySeconds = ref('0')
const repeatInterval = ref('')
const repeatMax = ref('')
const stopOnAck = ref(false)
const notifierIds = ref<string[]>([])

const selectedType = computed(() =>
  types.value.find((t) => t.type === (editing.value?.type ?? typeSlug.value)),
)

onMounted(() => {
  listEventTypes().then((t) => (types.value = t)).catch(() => {})
  listNotifiers({ size: 100 }).then((p) => (notifiers.value = p.items)).catch(() => {})
})

function resetForm() {
  typeSlug.value = ''
  config.value = {}
  secrets.value = {}
  runMode.value = 'immediate'
  delaySeconds.value = '0'
  repeatInterval.value = ''
  repeatMax.value = ''
  stopOnAck.value = false
  notifierIds.value = []
  action.reset()
}

function openAdd() {
  resetForm()
  adding.value = true
}

function openEdit(event: WatcherEventResponse) {
  resetForm()
  editing.value = event
  config.value = { ...(event.config ?? {}) }
  runMode.value = event.run_mode
  delaySeconds.value = String(event.delay_seconds ?? 0)
  repeatInterval.value = event.repeat_interval_seconds ? String(event.repeat_interval_seconds) : ''
  repeatMax.value = event.repeat_max ? String(event.repeat_max) : ''
  stopOnAck.value = event.stop_on_ack
  notifierIds.value = (event.notifiers ?? []).map((n) => n.id).filter(Boolean) as string[]
}

function close() {
  adding.value = false
  editing.value = null
}

/** `null` clears an optional number server-side; `undefined` would leave it. */
function optionalNumber(raw: string): number | null {
  return raw === '' ? null : Number(raw)
}

async function submit() {
  const missing = missingRequiredFields(selectedType.value?.config_schema, config.value, secrets.value, {
    editing: Boolean(editing.value),
  })
  if (missing.length) {
    action.error.value = `Please fill in: ${missing.join(', ')}.`
    return
  }

  const shared = {
    config: config.value,
    run_mode: runMode.value,
    delay_seconds: runMode.value === 'delayed' ? Number(delaySeconds.value) || 0 : 0,
    repeat_interval_seconds:
      runMode.value === 'recurring' ? optionalNumber(repeatInterval.value) : null,
    repeat_max: runMode.value === 'recurring' ? optionalNumber(repeatMax.value) : null,
    stop_on_ack: stopOnAck.value,
    notifier_ids: selectedType.value?.uses_notifiers ? notifierIds.value : undefined,
  }

  const done = editing.value
    ? await action.run(() => updateEvent(props.watcherId, editing.value!.id, shared), 'Saved.')
    : await action.run(
        () => createEvent(props.watcherId, { type: typeSlug.value, ...shared }),
        'Event added.',
      )

  if (done) {
    close()
    emit('changed')
  }
}

async function remove(event: WatcherEventResponse) {
  const done = await action.run(() => deleteEvent(props.watcherId, event.id))
  if (done !== null) emit('changed')
}

async function toggleEnabled(event: WatcherEventResponse) {
  await action.run(() => updateEvent(props.watcherId, event.id, { enabled: !event.enabled }))
  emit('changed')
}

async function move(index: number, delta: number) {
  const ordered = [...props.events]
  const target = index + delta
  if (target < 0 || target >= ordered.length) return

  const moved = ordered[index]
  const swapped = ordered[target]
  if (!moved || !swapped) return

  ordered[index] = swapped
  ordered[target] = moved

  await action.run(() => reorderEvents(props.watcherId, ordered.map((e) => e.id)))
  emit('changed')
}

async function runTest(event: WatcherEventResponse) {
  await action.run(() => testEvent(props.watcherId, event.id), 'Test dispatched.')
}
</script>

<template>
  <section class="rounded-panel border border-edge bg-surface-raised shadow-panel">
    <header class="flex items-center justify-between gap-3 border-b border-edge px-5 py-3.5">
      <div>
        <h3 class="text-sm font-semibold">Events</h3>
        <p class="text-xs text-muted">Actions fired, in order, when a message matches.</p>
      </div>
      <AppButton variant="secondary" @click="openAdd">Add event</AppButton>
    </header>

    <div class="space-y-3 px-5 py-4">
      <AppAlert v-if="action.error.value">{{ action.error.value }}</AppAlert>
      <AppAlert v-if="action.success.value" tone="success">{{ action.success.value }}</AppAlert>

      <p v-if="!events.length" class="py-4 text-center text-sm text-muted">
        No events yet — this watcher records matches but does nothing with them.
      </p>

      <div
        v-for="(event, index) in events"
        :key="event.id"
        class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-sunken p-3"
        :class="!event.enabled && 'opacity-60'"
      >
        <div class="flex flex-col gap-0.5">
          <button
            type="button"
            class="rounded p-0.5 text-muted hover:text-body disabled:opacity-30"
            :disabled="index === 0"
            aria-label="Move up"
            @click="move(index, -1)"
          >
            <svg class="size-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12l5-5 5 5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            class="rounded p-0.5 text-muted hover:text-body disabled:opacity-30"
            :disabled="index === events.length - 1"
            aria-label="Move down"
            @click="move(index, 1)"
          >
            <svg class="size-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 8l5 5 5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium">
            {{ types.find((t) => t.type === event.type)?.label || humanise(event.type) }}
          </p>
          <p class="text-xs text-muted">
            {{ humanise(event.run_mode) }}
            <template v-if="event.run_mode === 'delayed'">
              · after {{ formatDuration(event.delay_seconds) }}
            </template>
            <template v-else-if="event.run_mode === 'recurring'">
              · every {{ formatDuration(event.repeat_interval_seconds) }}
            </template>
            <template v-if="event.notifiers?.length">
              · {{ event.notifiers.map((n) => n.name).join(', ') }}
            </template>
          </p>
        </div>

        <div class="flex items-center gap-1">
          <AppButton variant="ghost" @click="runTest(event)">Test</AppButton>
          <AppButton variant="ghost" @click="toggleEnabled(event)">
            {{ event.enabled ? 'Disable' : 'Enable' }}
          </AppButton>
          <AppButton variant="ghost" @click="openEdit(event)">Edit</AppButton>
          <button
            type="button"
            class="rounded-lg p-2 text-muted transition hover:bg-red-50 hover:text-red-600"
            aria-label="Delete event"
            @click="remove(event)"
          >
            <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <AppModal
      v-if="adding || editing"
      :title="editing ? 'Edit event' : 'Add an event'"
      wide
      @close="close"
    >
      <form id="event-form" class="space-y-4" novalidate @submit.prevent="submit">
        <AppAlert v-if="action.error.value">{{ action.error.value }}</AppAlert>

        <AppField v-if="!editing" v-slot="{ id }" label="Action">
          <AppSelect :id="id" v-model="typeSlug" required>
            <option value="">Select an action…</option>
            <option v-for="option in types" :key="option.type" :value="option.type">
              {{ option.label }}
            </option>
          </AppSelect>
        </AppField>

        <template v-if="selectedType">
          <p class="text-sm text-muted">{{ selectedType.description }}</p>

          <!-- Rendered from the handler's own config_schema. -->
          <ConfigSchemaForm
            v-model:config="config"
            v-model:secrets="secrets"
            :schema="selectedType.config_schema"
            :editing="Boolean(editing)"
          />

          <AppField
            v-if="selectedType.uses_notifiers"
            v-slot="{ id }"
            label="Notifiers"
            hint="Leave empty to use your default notifier."
          >
            <select
              :id="id"
              v-model="notifierIds"
              multiple
              size="4"
              class="block w-full rounded-lg bg-surface-raised px-3 py-2 text-sm ring-1 ring-edge ring-inset
                     focus:ring-2 focus:ring-brand-500"
            >
              <option v-for="n in notifiers" :key="n.id" :value="n.id">
                {{ n.name }} ({{ humanise(n.type) }})
              </option>
            </select>
          </AppField>

          <AppField v-slot="{ id }" label="When to run">
            <AppSelect :id="id" v-model="runMode as string">
              <option value="immediate">Immediately on match</option>
              <option value="delayed">After a delay</option>
              <option value="recurring">Repeatedly</option>
            </AppSelect>
          </AppField>

          <AppField v-if="runMode === 'delayed'" v-slot="{ id }" label="Delay (seconds)">
            <AppInput :id="id" v-model="delaySeconds" type="number" min="0" />
          </AppField>

          <template v-if="runMode === 'recurring'">
            <AppField v-slot="{ id }" label="Repeat every (seconds)">
              <AppInput :id="id" v-model="repeatInterval" type="number" min="1" />
            </AppField>
            <AppField v-slot="{ id }" label="Stop after (occurrences, optional)">
              <AppInput :id="id" v-model="repeatMax" type="number" min="1" />
            </AppField>
          </template>

          <AppCheckbox
            v-if="runMode !== 'immediate'"
            v-model="stopOnAck"
            label="Stop when acknowledged"
            hint="Acknowledging a run cancels its remaining occurrences."
          />
        </template>
      </form>

      <template #footer>
        <AppButton variant="secondary" @click="close">Cancel</AppButton>
        <AppButton
          type="submit"
          form="event-form"
          :loading="action.running.value"
          :disabled="!selectedType"
        >
          {{ editing ? 'Save changes' : 'Add event' }}
        </AppButton>
      </template>
    </AppModal>
  </section>
</template>
