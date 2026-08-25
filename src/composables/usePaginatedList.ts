import { ref, shallowRef, watch } from 'vue'
import { toMessage } from '@/api/messages'
import type { Page, PageMetadata } from '@/api/types'

type Filters = Record<string, string | number | undefined>

/**
 * Drives a paginated list view: page state, filters, loading and errors.
 *
 * Changing a filter resets to page 1 — staying on page 7 of a result set that
 * now has two pages would show an empty table and look like a bug.
 */
export function usePaginatedList<T>(
  loader: (query: Filters & { page: number; size: number }) => Promise<Page<T>>,
  options: { size?: number; filters?: Filters } = {},
) {
  const items = shallowRef<T[]>([])
  const paging = shallowRef<PageMetadata | undefined>()
  const loading = ref(false)
  const error = ref('')
  const page = ref(1)
  const size = ref(options.size ?? 20)
  const filters = ref<Filters>({ ...options.filters })

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const result = await loader({ ...filters.value, page: page.value, size: size.value })
      items.value = result.items
      paging.value = result.paging
    } catch (cause) {
      error.value = toMessage(cause)
      items.value = []
      paging.value = undefined
    } finally {
      loading.value = false
    }
  }

  function setFilter(key: string, value: string | number | undefined) {
    // Empty string is what a cleared <select> or search box produces; send it
    // as absent rather than as a filter matching the empty value.
    filters.value = { ...filters.value, [key]: value === '' ? undefined : value }
    page.value = 1
  }

  function goTo(next: number) {
    page.value = Math.max(1, next)
  }

  watch([page, size, filters], load, { deep: true })

  return { items, paging, loading, error, page, size, filters, load, setFilter, goTo }
}
