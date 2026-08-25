import type { JSONObject, Schema, SchemaField } from '@/api/types'

function isSecret(field: SchemaField): boolean {
  return field.secret === true || field.type === 'secret'
}

/**
 * Labels of required `config_schema` fields the user has left empty.
 *
 * The forms are `novalidate` so server errors render in one consistent place
 * rather than as native bubbles — which means required-ness has to be checked
 * here instead. Without it a form submits with a required field missing and the
 * server accepts a resource that cannot work: a mail account created with no
 * host, for instance, is stored happily and only fails later at verify, with an
 * error that points at the account rather than at the empty box.
 */
export function missingRequiredFields(
  schema: Schema | undefined,
  config: JSONObject,
  secrets: JSONObject,
  options: { editing?: boolean } = {},
): string[] {
  return (schema?.fields ?? [])
    .filter((field) => {
      if (!field.required) return false

      // A checkbox is never "missing" — false is a real answer.
      if (field.type === 'bool') return false

      const secret = isSecret(field)

      // Secrets are never returned by a read, so an untouched edit form shows
      // them blank on purpose. Requiring them would make saving a name change
      // impossible without re-entering the password.
      if (secret && options.editing) return false

      const value = (secret ? secrets : config)[field.name]
      return value === undefined || value === null || value === ''
    })
    .map((field) => field.label)
}
