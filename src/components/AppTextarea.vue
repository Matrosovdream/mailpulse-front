<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{ id?: string; invalid?: boolean }>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <textarea
    :id="id"
    v-model="model"
    v-bind="$attrs"
    :aria-invalid="invalid || undefined"
    rows="3"
    class="block w-full rounded-lg bg-surface-raised px-3 py-2.5 text-sm text-body ring-1 ring-inset
           transition placeholder:text-muted focus:ring-2 focus:ring-brand-500"
    :class="invalid ? 'ring-red-400' : 'ring-edge'"
  />
</template>
