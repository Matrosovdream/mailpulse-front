<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div data-surface="auth" class="grid min-h-dvh place-items-center bg-surface px-4">
    <div class="text-center">
      <p class="text-sm font-semibold text-brand-600">403</p>
      <h1 class="mt-2 text-2xl font-semibold tracking-tight text-body">Not permitted</h1>
      <p class="mt-2 text-sm text-muted">Your account doesn't have access to that page.</p>
      <RouterLink
        :to="{ name: 'dashboard' }"
        class="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Back to dashboard
      </RouterLink>
    </div>
  </div>
</template>
