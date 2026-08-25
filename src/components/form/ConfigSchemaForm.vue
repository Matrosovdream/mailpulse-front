<script setup lang="ts">
import { computed } from 'vue'
import AppCheckbox from '../AppCheckbox.vue'
import AppField from '../AppField.vue'
import AppInput from '../AppInput.vue'
import AppSelect from '../AppSelect.vue'
import AppTextarea from '../AppTextarea.vue'
import type { JSONObject, Schema, SchemaField } from '@/api/types'

/**
 * Renders a plug-in's form from the `config_schema` the server returned.
 *
 * This is the reason the catalog endpoints exist. Adding a mail provider, event
 * handler or notifier channel on the server ships a new `config_schema`, and the
 * form for it appears here with no frontend change. Hard-coding a form per
 * provider would work today and cost a release every time the backend grows.
 *
 * Values are split into two buckets on the way out, because the API takes them
 * as separate objects: fields marked `secret` go under `secrets` (encrypted at
 * rest, never returned by any read), everything else under `config`.
 */
const props = defineProps<{
  schema?: Schema
  /** Non-secret values, keyed by field name. Two-way. */
  config: JSONObject
  /** Secret values, keyed by field name. Two-way. Write-only by nature. */
  secrets: JSONObject
  /** True when editing: secrets are blank because the server never returns them. */
  editing?: boolean
}>()

const emit = defineEmits<{
  'update:config': [JSONObject]
  'update:secrets': [JSONObject]
}>()

const fields = computed<SchemaField[]>(() => props.schema?.fields ?? [])

function isSecret(field: SchemaField): boolean {
  return field.secret === true || field.type === 'secret'
}

function valueOf(field: SchemaField): string {
  const bucket = isSecret(field) ? props.secrets : props.config
  const raw = (bucket as Record<string, unknown>)[field.name]
  return raw === undefined || raw === null ? '' : String(raw)
}

function boolOf(field: SchemaField): boolean {
  return Boolean((props.config as Record<string, unknown>)[field.name])
}

function write(field: SchemaField, value: unknown) {
  const secret = isSecret(field)
  const bucket = { ...(secret ? props.secrets : props.config) } as Record<string, unknown>

  // An emptied optional field is removed rather than sent as "", which the
  // server would store as a real empty value.
  if (value === '' || value === undefined) delete bucket[field.name]
  else bucket[field.name] = value

  if (secret) emit('update:secrets', bucket as JSONObject)
  else emit('update:config', bucket as JSONObject)
}

function writeNumber(field: SchemaField, raw: string) {
  if (raw === '') return write(field, '')
  const parsed = Number(raw)
  write(field, Number.isNaN(parsed) ? raw : parsed)
}

function hintFor(field: SchemaField): string | undefined {
  if (isSecret(field) && props.editing) {
    return field.help
      ? `${field.help} Leave blank to keep the stored value.`
      : 'Leave blank to keep the stored value.'
  }
  return field.help
}
</script>

<template>
  <div v-if="fields.length" class="space-y-4">
    <template v-for="field in fields" :key="field.name">
      <!-- bool renders as a checkbox, which carries its own label -->
      <AppCheckbox
        v-if="field.type === 'bool'"
        :label="field.label"
        :hint="field.help"
        :model-value="boolOf(field)"
        @update:model-value="write(field, $event)"
      />

      <AppField
        v-else
        v-slot="{ id }"
        :label="field.required ? field.label : `${field.label} (optional)`"
        :hint="hintFor(field)"
      >
        <AppSelect
          v-if="field.type === 'enum'"
          :id="id"
          :model-value="valueOf(field)"
          :required="field.required && !editing"
          @update:model-value="write(field, $event)"
        >
          <option value="">Select…</option>
          <option v-for="option in field.options ?? []" :key="option" :value="option">
            {{ option }}
          </option>
        </AppSelect>

        <AppTextarea
          v-else-if="field.type === 'text'"
          :id="id"
          :model-value="valueOf(field)"
          :placeholder="field.placeholder"
          :required="field.required && !editing"
          @update:model-value="write(field, $event)"
        />

        <AppInput
          v-else-if="field.type === 'int'"
          :id="id"
          type="number"
          :model-value="valueOf(field)"
          :placeholder="field.placeholder"
          :required="field.required && !editing"
          @update:model-value="writeNumber(field, $event)"
        />

        <AppInput
          v-else
          :id="id"
          :type="isSecret(field) ? 'password' : 'text'"
          :autocomplete="isSecret(field) ? 'new-password' : 'off'"
          :model-value="valueOf(field)"
          :placeholder="field.placeholder"
          :required="field.required && !editing && !isSecret(field)"
          @update:model-value="write(field, $event)"
        />
      </AppField>
    </template>
  </div>

  <p v-else class="text-sm text-muted">This type needs no extra configuration.</p>
</template>
