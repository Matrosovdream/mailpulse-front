/**
 * Field limits taken from the request schemas in `docs/api/openapi.yaml`.
 *
 * Mirrored here so forms can reject bad input before spending a round trip, and
 * so the browser's own `maxlength` matches what the server will accept. The
 * server remains the authority — this only saves the user a failed request.
 */
export const limits = {
  email: { maxLength: 320 },
  name: { maxLength: 100 },
  password: { minLength: 6, maxLength: 100 },
  timezone: { maxLength: 64 },
  resetToken: { maxLength: 200 },
} as const
