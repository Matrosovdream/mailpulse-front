<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { listNotifierTypes } from '@/api/endpoints/catalog'
import { createNotifier } from '@/api/endpoints/notifiers'
import { useAction, useAsync } from '@/composables/useAsync'
import AppAlert from '@/components/AppAlert.vue'
import AppButton from '@/components/AppButton.vue'
import AppCheckbox from '@/components/AppCheckbox.vue'
import AppField from '@/components/AppField.vue'
import AppInput from '@/components/AppInput.vue'
import AppModal from '@/components/AppModal.vue'
import AppSelect from '@/components/AppSelect.vue'
import AppSpinner from '@/components/AppSpinner.vue'
import ConfigSchemaForm from '@/components/form/ConfigSchemaForm.vue'
import { missingRequiredFields } from '@/components/form/validation'
import type { JSONObject } from '@/api/types'

const emit = defineEmits<{ close: []; created: [string] }>()

const { data: types, error: loadError, loading, run } = useAsync(listNotifierTypes)
const action = useAction()

const typeSlug = ref('')
const name = ref('')
const isDefault = ref(false)
const config = ref<JSONObject>({})
const secrets = ref<JSONObject>({})

const selected = computed(() => types.value?.find((t) => t.type === typeSlug.value))

onMounted(run)

// Each channel type has its own config_schema, so values from a previously
// selected type would not belong to the new one.
watch(selected, () => {
  config.value = {}
  secrets.value = {}
})

async function submit() {
  if (!selected.value) return

  const missing = missingRequiredFields(selected.value.config_schema, config.value, secrets.value)
  if (missing.length) {
    action.error.value = `Please fill in: ${missing.join(', ')}.`
    return
  }

  const created = await action.run(() =>
    createNotifier({
      type: selected.value!.type,
      name: name.value,
      config: Object.keys(config.value).length ? config.value : undefined,
      secrets: Object.keys(secrets.value).length ? secrets.value : undefined,
      is_default: isDefault.value || undefined,
    }),
  )

  if (created) emit('created', created.id)
}
</script>

<template>
  <AppModal title="Add a notifier" wide @close="emit('close')">
    <div v-if="loading" class="flex justify-center py-10 text-muted"><AppSpinner /></div>

    <AppAlert v-else-if="loadError">{{ loadError }}</AppAlert>

    <form v-else id="create-notifier" class="space-y-4" novalidate @submit.prevent="submit">
      <AppAlert v-if="action.error.value">{{ action.error.value }}</AppAlert>

      <AppField v-slot="{ id }" label="Channel">
        <AppSelect :id="id" v-model="typeSlug" required>
          <option value="">Select a channel…</option>
          <option v-for="option in types ?? []" :key="option.type" :value="option.type">
            {{ option.label }}
          </option>
        </AppSelect>
      </AppField>

      <template v-if="selected">
        <p class="text-sm text-muted">{{ selected.description }}</p>

        <AppField v-slot="{ id }" label="Name">
          <AppInput :id="id" v-model="name" required :maxlength="100" placeholder="Ops alerts" />
        </AppField>

        <!-- Rendered from the channel's own config_schema. -->
        <ConfigSchemaForm
          v-model:config="config"
          v-model:secrets="secrets"
          :schema="selected.config_schema"
        />

        <AppCheckbox
          v-model="isDefault"
          label="Make this the default"
          hint="Used by events that name no notifier. Clears the flag on your others."
        />

        <AppAlert v-if="selected.requires_verification" tone="info">
          This channel needs verifying before it will deliver. You'll be walked through it after
          saving.
        </AppAlert>
      </template>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">Cancel</AppButton>
      <AppButton
        type="submit"
        form="create-notifier"
        :loading="action.running.value"
        :disabled="!selected"
      >
        Add notifier
      </AppButton>
    </template>
  </AppModal>
</template>
