<script setup lang="ts">
withDefaults(defineProps<{ nowrap?: boolean; muted?: boolean }>(), {
  nowrap: false,
  muted: false,
})
</script>

<template>
  <td class="px-4 py-3 align-middle" :class="[nowrap && 'whitespace-nowrap', muted && 'text-muted']">
    <slot />
  </td>
</template>
