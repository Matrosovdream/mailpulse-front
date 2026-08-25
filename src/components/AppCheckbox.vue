<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ label: string; hint?: string }>()

const model = defineModel<boolean>({ required: true })
const id = useId()
</script>

<template>
  <div class="flex gap-2.5">
    <input
      :id="id"
      v-model="model"
      type="checkbox"
      class="mt-0.5 size-4 shrink-0 rounded border-edge text-brand-600 focus:ring-brand-500"
    />
    <div>
      <label :for="id" class="block text-sm font-medium text-body">{{ label }}</label>
      <p v-if="hint" class="text-xs text-muted">{{ hint }}</p>
    </div>
  </div>
</template>
