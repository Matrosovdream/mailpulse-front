<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="px-6 py-14 text-center">
    <p class="text-sm font-medium text-body">{{ title }}</p>
    <p v-if="description" class="mx-auto mt-1 max-w-sm text-sm text-muted">{{ description }}</p>
    <div class="mt-5 flex justify-center">
      <slot name="action" />
    </div>
  </div>
</template>
