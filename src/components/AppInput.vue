<script setup lang="ts">
// The root element is the input itself, so let the caller's attrs land there
// once via the explicit v-bind rather than also being applied automatically.
defineOptions({ inheritAttrs: false })

defineProps<{ id?: string; invalid?: boolean }>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <input
    :id="id"
    v-model="model"
    v-bind="$attrs"
    :aria-invalid="invalid || undefined"
    class="block w-full rounded-lg bg-surface-raised px-3 py-2.5 text-sm text-body ring-1 ring-inset
           transition placeholder:text-muted focus:ring-2 focus:ring-brand-500"
    :class="invalid ? 'ring-red-400' : 'ring-edge'"
  />
</template>
