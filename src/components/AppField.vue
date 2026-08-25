<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  label: string
  error?: string
  hint?: string
}>()

// Pairs the label with the control without the caller passing an id.
const id = useId()
</script>

<template>
  <div class="space-y-1.5">
    <label :for="id" class="block text-sm font-medium text-body">{{ label }}</label>

    <slot :id="id" :invalid="Boolean(error)" />

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="text-sm text-muted">{{ hint }}</p>
  </div>
</template>
