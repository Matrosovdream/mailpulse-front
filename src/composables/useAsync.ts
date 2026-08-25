import { ref, shallowRef } from 'vue'
import { toMessage } from '@/api/messages'

/**
 * Wraps a one-shot async call with the loading and error state every view needs,
 * so each of them does not hand-roll the same three refs.
 */
export function useAsync<T>(loader: () => Promise<T>) {
  const data = shallowRef<T | null>(null)
  const error = ref('')
  const loading = ref(false)

  async function run(): Promise<T | null> {
    loading.value = true
    error.value = ''
    try {
      const result = await loader()
      data.value = result
      return result
    } catch (cause) {
      error.value = toMessage(cause)
      return null
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, run }
}

/**
 * An action the user triggers — save, delete, verify.
 *
 * Separate from useAsync because the states differ: an action reports success
 * as well as failure, and it holds no data of its own.
 */
export function useAction() {
  const running = ref(false)
  const error = ref('')
  const success = ref('')

  async function run<T>(action: () => Promise<T>, successMessage = ''): Promise<T | null> {
    running.value = true
    error.value = ''
    success.value = ''
    try {
      const result = await action()
      success.value = successMessage
      return result
    } catch (cause) {
      error.value = toMessage(cause)
      return null
    } finally {
      running.value = false
    }
  }

  function reset() {
    error.value = ''
    success.value = ''
  }

  return { running, error, success, run, reset }
}
