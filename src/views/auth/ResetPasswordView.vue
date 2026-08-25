<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { resetPassword } from '@/api/endpoints/auth'
import { toMessage } from '@/api/messages'
import { limits } from '@/api/constraints'
import AppAlert from '@/components/AppAlert.vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppInput from '@/components/AppInput.vue'

const route = useRoute()
const router = useRouter()

// The reset mail links here with the token in the query string.
const token = typeof route.query.token === 'string' ? route.query.token : ''

const password = ref('')
const confirmation = ref('')
const error = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''

  if (password.value.length < limits.password.minLength) {
    error.value = `Password must be at least ${limits.password.minLength} characters.`
    return
  }
  if (password.value !== confirmation.value) {
    error.value = 'The two passwords do not match.'
    return
  }

  submitting.value = true
  try {
    await resetPassword(token, password.value)
    await router.push({ name: 'login', query: { reset: '1' } })
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
      <h1 class="text-xl font-semibold tracking-tight text-body">Choose a new password</h1>
    </header>

    <AppAlert v-if="!token" class="mb-5">
      This reset link is missing its token. Request a new one from the
      <RouterLink :to="{ name: 'forgot-password' }" class="font-medium underline">
        forgot password
      </RouterLink>
      page.
    </AppAlert>

    <template v-else>
      <AppAlert v-if="error" class="mb-5">{{ error }}</AppAlert>

      <form class="space-y-4" novalidate @submit.prevent="submit">
        <AppField
          v-slot="{ id }"
          label="New password"
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

        <AppField v-slot="{ id }" label="Confirm password">
          <AppInput
            :id="id"
            v-model="confirmation"
            type="password"
            autocomplete="new-password"
            required
            :maxlength="limits.password.maxLength"
            placeholder="••••••••"
          />
        </AppField>

        <AppButton type="submit" block :loading="submitting">Set new password</AppButton>
      </form>
    </template>
  </div>
</template>
