/**
 * Escapes a string for safe interpolation into a `RegExp` source string.
 * Replaces the prior hyphen-only escape (`replace(/-/g, "\\-")`), which CodeQL flags as
 * `js/incomplete-sanitization` because backslashes and other metacharacters must be handled too.
 */
export function escapeRegExpSource(fragment: string): string {
  return fragment.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}
