<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { forgotPassword } from '@/api/endpoints/auth'
import { toMessage } from '@/api/messages'
import { limits } from '@/api/constraints'
import AppAlert from '@/components/AppAlert.vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppInput from '@/components/AppInput.vue'

const email = ref('')
const error = ref('')
const sent = ref(false)
const submitting = ref(false)

async function submit() {
  error.value = ''
  submitting.value = true

  try {
    await forgotPassword(email.value)
    sent.value = true
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
      <h1 class="text-xl font-semibold tracking-tight text-body">Reset your password</h1>
      <p class="mt-1 text-sm text-muted">
        We'll email you a link to choose a new one.
      </p>
    </header>

    <!--
      The confirmation is deliberately unconditional on whether the address is
      registered — saying "no such account" would turn this form into a way to
      test which addresses exist.
    -->
    <AppAlert v-if="sent" tone="success" class="mb-5">
      If that address has an account, a reset link is on its way.
    </AppAlert>

    <template v-else>
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

        <AppButton type="submit" block :loading="submitting">Send reset link</AppButton>
      </form>
    </template>

    <p class="mt-6 text-center text-sm text-muted">
      <RouterLink :to="{ name: 'login' }" class="font-medium text-brand-600 hover:text-brand-700">
        Back to sign in
      </RouterLink>
    </p>
  </div>
</template>
