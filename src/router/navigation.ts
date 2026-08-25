import type { RoleSlug } from '@/api/types'

export interface NavItem {
  label: string
  to: { name: string }
  /** Roles that may see this item. Absent means every authenticated user. */
  roles?: RoleSlug[]
}

export interface NavSection {
  label: string
  items: NavItem[]
}

/**
 * The dashboard menu, for both roles.
 *
 * One dashboard, one menu definition, filtered per role — rather than a separate
 * admin area. Filtering here is presentation only: hiding an item does not
 * protect the route behind it, which is why the same roles are declared on the
 * route's `meta` and enforced again by the API.
 *
 * Sections beyond Overview and Administration arrive with their feature work.
 */
export const navigation: NavSection[] = [
  {
    label: 'Monitoring',
    items: [{ label: 'Overview', to: { name: 'dashboard' } }],
  },
  {
    label: 'System',
    items: [{ label: 'Administration', to: { name: 'admin' }, roles: ['superadmin'] }],
  },
]

/** Drops items the given roles may not see, then empty sections. */
export function visibleNavigation(roles: RoleSlug[]): NavSection[] {
  return navigation
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles?.length || item.roles.some((role) => roles.includes(role)),
      ),
    }))
    .filter((section) => section.items.length > 0)
}
