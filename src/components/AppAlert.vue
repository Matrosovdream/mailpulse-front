<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'error' | 'success' | 'info' }>(), { tone: 'error' })
</script>

<template>
  <div
    role="alert"
    class="rounded-lg px-3.5 py-3 text-sm ring-1 ring-inset"
    :class="{
      'bg-red-50 text-red-800 ring-red-200': tone === 'error',
      'bg-emerald-50 text-emerald-800 ring-emerald-200': tone === 'success',
      'bg-brand-50 text-brand-900 ring-brand-200': tone === 'info',
    }"
  >
    <slot />
  </div>
</template>
