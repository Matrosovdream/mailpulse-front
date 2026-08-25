<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 class="text-lg font-semibold tracking-tight">{{ title }}</h2>
      <p v-if="subtitle" class="mt-1 text-sm text-muted">{{ subtitle }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
