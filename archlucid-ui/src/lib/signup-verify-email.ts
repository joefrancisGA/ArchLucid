/**
 * Masks an email for shared-screen display: first character of local part + *** + @domain.
 * Returns empty string when input is not a plausible email.
 */
export function maskEmailForDisplay(email: string): string {
  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return "";
  }

  const atIndex = trimmed.indexOf("@");

  if (atIndex <= 0 || atIndex === trimmed.length - 1) {
    return "";
  }

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (local.length === 0 || domain.length === 0) {
    return "";
  }

  const visibleLocal = local.length === 1 ? local : `${local[0]}***`;

  return `${visibleLocal}@${domain}`;
}
