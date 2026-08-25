<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <!--
    data-surface picks the auth palette from styles/main.css. Components inside
    use semantic utilities (bg-surface-raised, rounded-panel) that resolve
    differently here than in the dashboard — one component set, three surfaces.
  -->
  <div data-surface="auth" class="grid min-h-dvh place-items-center bg-surface px-4 py-12">
    <div class="w-full max-w-sm">
      <RouterLink :to="{ name: 'home' }" class="mb-8 flex items-center justify-center gap-2.5">
        <span class="grid size-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          M
        </span>
        <span class="text-lg font-semibold tracking-tight text-body">MailPulse</span>
      </RouterLink>

      <main class="rounded-panel bg-surface-raised p-7 shadow-panel">
        <RouterView />
      </main>
    </div>
  </div>
</template>
