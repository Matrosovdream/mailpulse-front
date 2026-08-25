<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { listSessions, revokeSession, updateCurrentUser } from '@/api/endpoints/auth'
import { useAction } from '@/composables/useAsync'
import { useAuthStore } from '@/stores/auth'
import { limits } from '@/api/constraints'
import { formatDateTime, formatRelative, truncate } from '@/utils/format'
import AppAlert from '@/components/AppAlert.vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppInput from '@/components/AppInput.vue'
import PageHeader from '@/components/PageHeader.vue'
import type { SessionResponse } from '@/api/types'

const auth = useAuthStore()
const profile = useAction()
const sessionAction = useAction()

const name = ref(auth.user?.name ?? '')
const timezone = ref(auth.user?.timezone ?? '')
const password = ref('')
const sessions = ref<SessionResponse[]>([])

async function loadSessions() {
  try {
    sessions.value = await listSessions()
  } catch {
    // The panel simply stays empty; the page is still usable without it.
  }
}

onMounted(loadSessions)

async function save() {
  const updated = await profile.run(
    () =>
      updateCurrentUser({
        name: name.value || undefined,
        timezone: timezone.value || undefined,
        password: password.value || undefined,
      }),
    'Profile saved.',
  )
  password.value = ''
  // Keep the sidebar and stored session in step with the new name.
  if (updated) await auth.refreshUser()
}

async function revoke(session: SessionResponse) {
  await sessionAction.run(() => revokeSession(session.id), 'Session revoked.')
  // Revoking the current session invalidates this token, so sign out locally
  // rather than leaving the UI holding one the server no longer honours.
  if (session.current) {
    auth.clearSession()
    window.location.assign('/login')
    return
  }
  await loadSessions()
}
</script>

<template>
  <div>
    <PageHeader title="Account" subtitle="Your profile and active sessions." />

    <div class="grid gap-5 lg:grid-cols-2">
      <section class="rounded-panel border border-edge bg-surface-raised p-5 shadow-panel">
        <h3 class="mb-4 text-sm font-semibold">Profile</h3>

        <AppAlert v-if="profile.error.value" class="mb-4">{{ profile.error.value }}</AppAlert>
        <AppAlert v-if="profile.success.value" tone="success" class="mb-4">
          {{ profile.success.value }}
        </AppAlert>

        <form class="space-y-4" novalidate @submit.prevent="save">
          <AppField v-slot="{ id }" label="Email" hint="Email cannot be changed here.">
            <AppInput :id="id" :model-value="auth.user?.email ?? ''" disabled />
          </AppField>

          <AppField v-slot="{ id }" label="Name">
            <AppInput :id="id" v-model="name" :maxlength="limits.name.maxLength" />
          </AppField>

          <AppField v-slot="{ id }" label="Timezone" hint="IANA name, e.g. Europe/Berlin.">
            <AppInput :id="id" v-model="timezone" :maxlength="limits.timezone.maxLength" />
          </AppField>

          <AppField
            v-slot="{ id }"
            label="New password"
            :hint="`Leave blank to keep your current one. At least ${limits.password.minLength} characters.`"
          >
            <AppInput
              :id="id"
              v-model="password"
              type="password"
              autocomplete="new-password"
              :minlength="limits.password.minLength"
              :maxlength="limits.password.maxLength"
            />
          </AppField>

          <div class="flex justify-end">
            <AppButton type="submit" :loading="profile.running.value">Save changes</AppButton>
          </div>
        </form>
      </section>

      <section class="overflow-hidden rounded-panel border border-edge bg-surface-raised shadow-panel">
        <header class="border-b border-edge px-5 py-3.5">
          <h3 class="text-sm font-semibold">Active sessions</h3>
          <p class="text-xs text-muted">Revoking one signs that device out immediately.</p>
        </header>

        <AppAlert v-if="sessionAction.error.value" class="m-4">
          {{ sessionAction.error.value }}
        </AppAlert>

        <p v-if="!sessions.length" class="px-5 py-8 text-center text-sm text-muted">
          No other sessions.
        </p>

        <ul v-else class="divide-y divide-edge">
          <li v-for="session in sessions" :key="session.id" class="px-5 py-3">
            <div class="flex items-start gap-3">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium">
                  {{ truncate(session.user_agent, 44) }}
                  <span
                    v-if="session.current"
                    class="ml-1.5 rounded bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700"
                  >
                    This device
                  </span>
                </p>
                <p class="text-xs text-muted">
                  {{ session.ip || 'unknown IP' }} · last used
                  {{ formatRelative(session.last_used_at) }} · expires
                  {{ formatDateTime(session.expires_at) }}
                </p>
              </div>
              <AppButton variant="ghost" @click="revoke(session)">Revoke</AppButton>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
