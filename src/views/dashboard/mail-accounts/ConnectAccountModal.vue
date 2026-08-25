<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { listMailProviderTypes } from '@/api/endpoints/catalog'
import { authorizeOAuth, createMailAccount } from '@/api/endpoints/mailAccounts'
import { useAction, useAsync } from '@/composables/useAsync'
import { limits } from '@/api/constraints'
import AppAlert from '@/components/AppAlert.vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppInput from '@/components/AppInput.vue'
import AppModal from '@/components/AppModal.vue'
import AppSelect from '@/components/AppSelect.vue'
import AppSpinner from '@/components/AppSpinner.vue'
import ConfigSchemaForm from '@/components/form/ConfigSchemaForm.vue'
import { missingRequiredFields } from '@/components/form/validation'
import type { AuthMode, JSONObject } from '@/api/types'

const emit = defineEmits<{ close: []; connected: [] }>()

const { data: providers, error: loadError, loading, run } = useAsync(listMailProviderTypes)
const action = useAction()

const providerSlug = ref('')
const emailAddress = ref('')
const displayName = ref('')
const authMode = ref<AuthMode | ''>('')
const settings = ref<JSONObject>({})
const secrets = ref<JSONObject>({})

const provider = computed(() => providers.value?.find((p) => p.slug === providerSlug.value))
const usesOAuth = computed(() => authMode.value === 'oauth2' || authMode.value === 'xoauth2')

onMounted(run)

// Selecting a provider resets the fields below it: its config_schema, auth modes
// and host/port defaults are all different, so carrying values across would
// submit settings the new provider never asked for.
watch(provider, (next) => {
  authMode.value = next?.auth_modes?.[0] ?? ''
  settings.value = { ...(next?.defaults ?? {}) } as JSONObject
  secrets.value = {}
})

async function submit() {
  if (!provider.value) return

  // OAuth providers never take a password here — the browser goes to the
  // provider's consent screen and the server completes the exchange.
  if (usesOAuth.value) {
    const result = await action.run(() => authorizeOAuth(provider.value!.slug))
    if (result?.redirect_url) window.location.assign(result.redirect_url)
    return
  }

  const missing = missingRequiredFields(provider.value.config_schema, settings.value, secrets.value)
  if (missing.length) {
    action.error.value = `Please fill in: ${missing.join(', ')}.`
    return
  }

  // The provider's schema marks username and password as secret, but a mail
  // account request has no `secrets` object — it carries those two as top-level
  // fields and everything non-secret under `settings`. So lift them out here
  // rather than rendering a second, hard-coded pair of credential inputs that
  // would duplicate what the schema already declares.
  const { username, password, ...otherSecrets } = secrets.value as Record<string, unknown>

  if (Object.keys(otherSecrets).length) {
    // No transport exists for these. Fail loudly rather than dropping them.
    action.error.value =
      `This provider declares secret field(s) the API cannot accept: ` +
      `${Object.keys(otherSecrets).join(', ')}.`
    return
  }

  const created = await action.run(() =>
    createMailAccount({
      provider: provider.value!.slug,
      email_address: emailAddress.value,
      display_name: displayName.value || undefined,
      auth_mode: (authMode.value || undefined) as AuthMode | undefined,
      settings: Object.keys(settings.value).length ? settings.value : undefined,
      username: username === undefined ? undefined : String(username),
      password: password === undefined ? undefined : String(password),
    }),
  )

  if (created) emit('connected')
}
</script>

<template>
  <AppModal title="Connect a mailbox" wide @close="emit('close')">
    <div v-if="loading" class="flex justify-center py-10 text-muted"><AppSpinner /></div>

    <AppAlert v-else-if="loadError">{{ loadError }}</AppAlert>

    <form v-else id="connect-account" class="space-y-4" novalidate @submit.prevent="submit">
      <AppAlert v-if="action.error.value">{{ action.error.value }}</AppAlert>

      <AppField v-slot="{ id }" label="Provider">
        <AppSelect :id="id" v-model="providerSlug" required>
          <option value="">Select a provider…</option>
          <option
            v-for="option in providers ?? []"
            :key="option.slug"
            :value="option.slug"
            :disabled="!option.available"
          >
            {{ option.label }}{{ option.available ? '' : ' — unavailable' }}
          </option>
        </AppSelect>
      </AppField>

      <template v-if="provider">
        <AppAlert v-if="!provider.available" tone="info">
          {{ provider.unavailable_reason || 'No client is registered for this provider.' }}
        </AppAlert>

        <AppField v-slot="{ id }" label="Email address">
          <AppInput
            :id="id"
            v-model="emailAddress"
            type="email"
            required
            :maxlength="limits.email.maxLength"
            placeholder="you@example.com"
          />
        </AppField>

        <AppField v-slot="{ id }" label="Display name (optional)">
          <AppInput :id="id" v-model="displayName" :maxlength="150" placeholder="Work inbox" />
        </AppField>

        <AppField
          v-if="(provider.auth_modes?.length ?? 0) > 1"
          v-slot="{ id }"
          label="Authentication"
        >
          <AppSelect :id="id" v-model="authMode as string" required>
            <option v-for="mode in provider.auth_modes" :key="mode" :value="mode">
              {{ mode === 'app_password' ? 'App password' : mode.toUpperCase() }}
            </option>
          </AppSelect>
        </AppField>

        <AppAlert v-if="usesOAuth" tone="info">
          You'll be sent to {{ provider.label }} to grant access, then returned here.
        </AppAlert>

        <!-- Rendered from the provider's own config_schema, not hard-coded. -->
        <ConfigSchemaForm
          v-model:config="settings"
          v-model:secrets="secrets"
          :schema="provider.config_schema"
        />

        <p v-if="provider.help_url" class="text-sm">
          <a
            :href="provider.help_url"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-brand-600 hover:text-brand-700"
          >
            {{ provider.label }} setup instructions ↗
          </a>
        </p>
      </template>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">Cancel</AppButton>
      <AppButton
        type="submit"
        form="connect-account"
        :loading="action.running.value"
        :disabled="!provider || !provider.available"
      >
        {{ usesOAuth ? 'Continue to provider' : 'Connect' }}
      </AppButton>
    </template>
  </AppModal>
</template>
