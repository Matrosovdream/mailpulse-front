<script setup lang="ts">
import AppButton from './AppButton.vue'
import AppModal from './AppModal.vue'

withDefaults(
  defineProps<{
    title: string
    message: string
    confirmLabel?: string
    danger?: boolean
    running?: boolean
  }>(),
  { confirmLabel: 'Confirm', danger: false, running: false },
)

const emit = defineEmits<{ confirm: []; close: [] }>()
</script>

<template>
  <AppModal :title="title" @close="emit('close')">
    <p class="text-sm text-muted">{{ message }}</p>

    <template #footer>
      <AppButton variant="secondary" :disabled="running" @click="emit('close')">Cancel</AppButton>
      <AppButton
        :variant="danger ? 'danger' : 'primary'"
        :loading="running"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </AppButton>
    </template>
  </AppModal>
</template>
