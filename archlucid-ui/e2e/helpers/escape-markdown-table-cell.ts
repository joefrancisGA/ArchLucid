/**
 * Escapes a string for safe interpolation into a Markdown table cell.
 * Replaces the prior pipe/newline-only replace, which CodeQL flags as
 * `js/incomplete-sanitization` because backslashes must be escaped first.
 */
export function escapeMarkdownTableCell(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ");
}
