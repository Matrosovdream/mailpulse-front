<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
    block?: boolean
  }>(),
  { variant: 'primary', type: 'button', loading: false, disabled: false, block: false },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition
           disabled:cursor-not-allowed disabled:opacity-60"
    :class="[
      block && 'w-full',
      variant === 'primary' && 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
      variant === 'secondary' &&
        'bg-surface-raised text-body ring-1 ring-edge ring-inset hover:bg-surface-sunken',
      variant === 'ghost' && 'text-muted hover:bg-surface-sunken hover:text-body',
      variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    ]"
  >
    <span
      v-if="loading"
      class="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
