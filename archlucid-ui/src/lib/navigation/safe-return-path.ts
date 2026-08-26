/**
 * Open-redirect protection for post-sign-in `returnUrl` / `callbackUrl` query params.
 * Only same-origin relative paths are ever accepted; everything else falls back to "/".
 */

/** ASCII control characters (including NUL and DEL) that some browsers strip before parsing a URL. */
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/g;

const MAX_RETURN_PATH_DECODE_PASSES = 8;

function stripControlChars(candidate: string): string {
  return candidate.replace(CONTROL_CHARS_RE, "");
}

function containsProtocolRelativeTraversal(path: string): boolean {
  return path.startsWith("//") || path.startsWith("/\\") || path.includes("//") || path.includes("/\\");
}

function containsPercentEncodedSlash(value: string): boolean {
  const lower = value.toLowerCase();

  return lower.includes("%2f") || lower.includes("%5c");
}

function containsBackslash(path: string): boolean {
  return path.includes("\\");
}

function containsDotDotSegment(path: string): boolean {
  const pathOnly = path.split("?")[0] ?? path;

  for (const segment of pathOnly.split("/")) {

    if (segment === "..") {
      return true;
    }
  }

  return false;
}

/**
 * True when `candidate` is a safe, same-origin relative path suitable for a post-sign-in redirect.
 * Rejects absolute URLs, protocol-relative URLs (`//evil.example`), backslash tricks (`/\evil.example`
 * — some browsers treat a leading backslash as a slash), embedded protocol-relative segments (`/safe//evil.example`),
 * embedded schemes (`javascript:`, `https://…`), and control-character smuggling used to bypass naive `startsWith("/")` checks.
 */
export function isSafeReturnPath(candidate: string | null | undefined): candidate is string {
  if (!candidate) {
    return false;
  }

  const normalized = stripControlChars(candidate);

  if (!normalized.startsWith("/")) {
    return false;
  }

  if (containsProtocolRelativeTraversal(normalized)) {
    return false;
  }

  if (containsBackslash(normalized)) {
    return false;
  }

  if (containsDotDotSegment(normalized)) {
    return false;
  }

  if (normalized.includes("://")) {
    return false;
  }

  return isSafeReturnPathAfterPercentDecoding(normalized);
}

function isSafeReturnPathAfterPercentDecoding(candidate: string): boolean {
  let working = candidate;

  for (let decodePass = 0; decodePass < MAX_RETURN_PATH_DECODE_PASSES && working.includes("%"); decodePass++) {
    let decoded: string;

    try {
      decoded = decodeURIComponent(working);
    } catch {
      return false;
    }

    if (decoded === working) {
      break;
    }

    if (CONTROL_CHARS_RE.test(decoded)) {
      return false;
    }

    if (!decoded.startsWith("/") || containsProtocolRelativeTraversal(decoded)) {
      return false;
    }

    if (decoded.includes("://") || decoded.includes("\\") || decoded.includes("@")) {
      return false;
    }

    if (containsDotDotSegment(decoded)) {
      return false;
    }

    working = decoded;
  }

  if (containsProtocolRelativeTraversal(working)) {
    return false;
  }

  if (containsPercentEncodedSlash(working)) {
    return false;
  }

  if (containsBackslash(working)) {
    return false;
  }

  if (containsDotDotSegment(working)) {
    return false;
  }

  if (working.includes("%")) {
    return false;
  }

  return true;
}

/** Returns `candidate` when it is a safe relative path, otherwise `fallback` (default `"/"`). */
export function resolveSafeReturnPath(candidate: string | null | undefined, fallback = "/"): string {
  return isSafeReturnPath(candidate) ? candidate : fallback;
}
