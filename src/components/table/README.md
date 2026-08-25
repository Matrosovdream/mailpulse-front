The paginated table shared by every list view.

List endpoints return `paging` alongside `data`
(`{ page, size, total_item, total_page }`), and take `page`/`size` query
parameters — plus `from`/`to` on the activity endpoints, in **epoch
milliseconds**.

One table component consumes `Page<T>` from `src/api/types.ts`, so the twelve
list screens do not each reimplement paging.
