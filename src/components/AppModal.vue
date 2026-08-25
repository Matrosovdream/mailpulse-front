<script setup lang="ts">
import { onBeforeUnmount } from 'vue'

withDefaults(defineProps<{ title: string; wide?: boolean }>(), { wide: false })
const emit = defineEmits<{ close: [] }>()

// Escape closes the dialog, and the page behind it must not scroll while open.
function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

document.addEventListener('keydown', onKey)
document.body.style.overflow = 'hidden'

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="fixed inset-0 bg-ink-900/40" @click="emit('close')" />

    <div class="relative flex min-h-full items-start justify-center p-4 sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        class="w-full rounded-panel bg-surface-raised shadow-xl"
        :class="wide ? 'max-w-3xl' : 'max-w-lg'"
      >
        <header class="flex items-center justify-between border-b border-edge px-5 py-4">
          <h3 class="text-base font-semibold tracking-tight">{{ title }}</h3>
          <button
            type="button"
            class="-mr-1 rounded-lg p-1.5 text-muted hover:bg-surface-sunken hover:text-body"
            aria-label="Close"
            @click="emit('close')"
          >
            <svg class="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
            </svg>
          </button>
        </header>

        <div class="px-5 py-5">
          <slot />
        </div>

        <footer
          v-if="$slots.footer"
          class="flex justify-end gap-2 border-t border-edge px-5 py-4"
        >
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </div>
</template>
