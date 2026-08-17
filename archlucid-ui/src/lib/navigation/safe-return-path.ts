/**
 * Open-redirect protection for post-sign-in `returnUrl` / `callbackUrl` query params.
 * Only same-origin relative paths are ever accepted; everything else falls back to "/".
 */

/** ASCII control characters (including NUL and DEL) that some browsers strip before parsing a URL. */
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/g;

function stripControlChars(candidate: string): string {
  return candidate.replace(CONTROL_CHARS_RE, "");
}

/**
 * True when `candidate` is a safe, same-origin relative path suitable for a post-sign-in redirect.
 * Rejects absolute URLs, protocol-relative URLs (`//evil.example`), backslash tricks (`/\evil.example`
 * — some browsers treat a leading backslash as a slash), embedded schemes (`javascript:`, `https://…`),
 * and control-character smuggling used to bypass naive `startsWith("/")` checks.
 */
export function isSafeReturnPath(candidate: string | null | undefined): candidate is string {
  if (!candidate) {
    return false;
  }

  const normalized = stripControlChars(candidate);

  if (!normalized.startsWith("/")) {
    return false;
  }

  if (normalized.startsWith("//") || normalized.startsWith("/\\")) {
    return false;
  }

  if (normalized.includes("://")) {
    return false;
  }

  return isSafeReturnPathAfterPercentDecoding(normalized);
}

function isSafeReturnPathAfterPercentDecoding(candidate: string): boolean {
  let working = candidate;

  for (let decodePass = 0; decodePass < 3 && working.includes("%"); decodePass++) {
    let decoded: string;

    try {
      decoded = decodeURIComponent(working);
    } catch {
      return false;
    }

    if (decoded === working) {
      break;
    }

    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.startsWith("/\\")) {
      return false;
    }

    if (decoded.includes("://") || decoded.includes("\\") || decoded.includes("@")) {
      return false;
    }

    working = decoded;
  }

  return true;
}

/** Returns `candidate` when it is a safe relative path, otherwise `fallback` (default `"/"`). */
export function resolveSafeReturnPath(candidate: string | null | undefined, fallback = "/"): string {
  return isSafeReturnPath(candidate) ? candidate : fallback;
}
