<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toMessage } from '@/api/messages'
import { limits } from '@/api/constraints'
import AppAlert from '@/components/AppAlert.vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppInput from '@/components/AppInput.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''
  submitting.value = true

  try {
    await auth.login(email.value, password.value)

    // `next` comes from the guard when it intercepted a protected route. Only
    // same-site paths are honoured: taking an absolute URL from the query
    // string would turn this form into an open redirect.
    const next = route.query.next
    const target = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')
      ? next
      : { name: 'dashboard' as const }

    await router.push(target)
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
      <h1 class="text-xl font-semibold tracking-tight text-body">Welcome back</h1>
      <p class="mt-1 text-sm text-muted">Sign in to your MailPulse account.</p>
    </header>

    <AppAlert v-if="error" class="mb-5">{{ error }}</AppAlert>

    <form class="space-y-4" novalidate @submit.prevent="submit">
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

      <AppField v-slot="{ id }" label="Password">
        <AppInput
          :id="id"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          :maxlength="limits.password.maxLength"
          placeholder="••••••••"
        />
      </AppField>

      <div class="flex justify-end">
        <RouterLink
          :to="{ name: 'forgot-password' }"
          class="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Forgot password?
        </RouterLink>
      </div>

      <AppButton type="submit" block :loading="submitting">Sign in</AppButton>
    </form>

    <p class="mt-6 text-center text-sm text-muted">
      Don't have an account?
      <RouterLink :to="{ name: 'register' }" class="font-medium text-brand-600 hover:text-brand-700">
        Create one
      </RouterLink>
    </p>
  </div>
</template>
