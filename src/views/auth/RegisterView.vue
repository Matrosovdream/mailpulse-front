<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { register } from '@/api/endpoints/auth'
import { useAuthStore } from '@/stores/auth'
import { toMessage } from '@/api/messages'
import { limits } from '@/api/constraints'
import AppAlert from '@/components/AppAlert.vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppInput from '@/components/AppInput.vue'

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''

  if (password.value.length < limits.password.minLength) {
    error.value = `Password must be at least ${limits.password.minLength} characters.`
    return
  }

  submitting.value = true
  try {
    // Register does not return a session, so sign in with the same credentials
    // to land the user in the dashboard rather than back on the login form.
    await register({
      email: email.value,
      name: name.value,
      password: password.value,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    await auth.login(email.value, password.value)
    await router.push({ name: 'dashboard' })
  } catch (cause) {
    error.value = toMessage(cause)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <header class="mb-6">
      <h1 class="text-xl font-semibold tracking-tight text-body">Create your account</h1>
      <p class="mt-1 text-sm text-muted">Start watching your mailboxes.</p>
    </header>

    <AppAlert v-if="error" class="mb-5">{{ error }}</AppAlert>

    <form class="space-y-4" novalidate @submit.prevent="submit">
      <AppField v-slot="{ id }" label="Name">
        <AppInput
          :id="id"
          v-model="name"
          autocomplete="name"
          required
          :maxlength="limits.name.maxLength"
          placeholder="Ada Lovelace"
        />
      </AppField>

      <AppField v-slot="{ id }" label="Email">
        <AppInput
          :id="id"
          v-model="email"
          type="email"
          autocomplete="email"
          required
          :maxlength="limits.email.maxLength"
          placeholder="you@example.com"
        />
      </AppField>

      <AppField
        v-slot="{ id }"
        label="Password"
        :hint="`At least ${limits.password.minLength} characters.`"
      >
        <AppInput
          :id="id"
          v-model="password"
          type="password"
          autocomplete="new-password"
          required
          :minlength="limits.password.minLength"
          :maxlength="limits.password.maxLength"
          placeholder="••••••••"
        />
      </AppField>

      <AppButton type="submit" block :loading="submitting">Create account</AppButton>
    </form>

    <p class="mt-6 text-center text-sm text-muted">
      Already have an account?
      <RouterLink :to="{ name: 'login' }" class="font-medium text-brand-600 hover:text-brand-700">
        Sign in
      </RouterLink>
    </p>
  </div>
</template>
