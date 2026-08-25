<script setup lang="ts">
// Reachable only with the superadmin role — filtered from the menu, checked by
// the router guard, and enforced by the API's /api/admin group, which sits
// behind NewRequireRole(superadmin). The first two are convenience; the third
// is the one that counts.
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold tracking-tight">Administration</h2>
      <p class="mt-1 text-sm text-muted">Superadmin only.</p>
    </div>

    <div class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel">
      <p class="text-sm text-muted">
        The twelve <code class="rounded bg-surface-sunken px-1.5 py-0.5 text-xs">/api/admin/*</code>
        endpoints — users, stats, audit logs, and cross-tenant listings — get built out here.
      </p>
    </div>
  </div>
</template>
