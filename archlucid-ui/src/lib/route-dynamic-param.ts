/**
 * Reject literals leaked into URLs (`undefined` string from template bugs, empty segments).
 * Dynamic segments must redirect server-side before calling downstream loaders that assume opaque GUIDs.
 */
export function isInvalidDynamicRouteToken(raw: string): boolean {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return true;
  }

  const lower = trimmed.toLowerCase();

  return lower === "undefined" || lower === "null";
}
