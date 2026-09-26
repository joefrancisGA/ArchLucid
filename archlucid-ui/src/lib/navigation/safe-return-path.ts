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

/** Mirrors `AuthSignInReturnPathGuard.IsSlashHomoglyph` (Application layer). */
function isSlashHomoglyph(ch: string): boolean {
  const code = ch.codePointAt(0);

  return (
    code === 0xff0f // ／ FULLWIDTH SOLIDUS
    || code === 0xff3c // ＼ FULLWIDTH REVERSE SOLIDUS
    || code === 0x2215 // ∕ DIVISION SLASH
    || code === 0x2216 // ∖ SET MINUS
    || code === 0x2044 // ⁄ FRACTION SLASH
    || code === 0xfe68 // ﹨ SMALL REVERSE SOLIDUS
    || code === 0x2571 // ╱ BOX DRAWINGS LIGHT DIAGONAL UPPER RIGHT TO LOWER LEFT
    || code === 0x29f6 // ⧶ SOLIDUS WITH OVERLAY
    || code === 0x29f7 // ⧷ REVERSE SOLIDUS WITH TICK
    || code === 0x29f8 // ⧸ BIG SOLIDUS
    || code === 0x29fa // ⧺ DOUBLE SOLIDUS OPERATOR
    || code === 0x2afd // ⫽ DOUBLE SOLIDUS OPERATOR
    || code === 0x2572 // ╲ BOX DRAWINGS LIGHT DIAGONAL UPPER LEFT TO LOWER RIGHT
    || code === 0x29f9 // ⧹ BIG REVERSE SOLIDUS
    || code === 0x29f5 // ⧵ REVERSE SOLIDUS OPERATOR
    || code === 0x29b8 // ⦸ CIRCLED REVERSE SOLIDUS
    || code === 0x29c4 // ⧄ SQUARED RISING DIAGONAL SLASH
    || code === 0x29c5 // ⧅ SQUARED FALLING DIAGONAL SLASH
    || code === 0x2afb // ⫻ TRIPLE SOLIDUS BINARY RELATION
    || code === 0x2298 // ⊘ CIRCLED DIVISION SLASH
    || code === 0x2e4a // ⹊ DOTTED SOLIDUS
    || code === 0x244a // ⑊ OCR DOUBLE BACKSLASH
    || code === 0x27c8 // ⟈ REVERSE SOLIDUS PRECEDING SUBSET
    || code === 0x27c9 // ⟉ SUPERSET PRECEDING SOLIDUS
    || code === 0x27cb // ⟋ MATHEMATICAL RISING DIAGONAL
    || code === 0x27cd // ⟍ MATHEMATICAL FALLING DIAGONAL
    || code === 0x29f4 // ⧴ SOLIDUS INTEROPERATOR
    || code === 0x2aff
  ); // ⫿ DOUBLE REVERSE SOLIDUS OPERATOR
}

/** Mirrors `AuthSignInReturnPathGuard.IsDotHomoglyph` (Application layer). */
function isDotHomoglyph(ch: string): boolean {
  const code = ch.codePointAt(0);

  return (
    code === 0xff0e // ． FULLWIDTH FULL STOP
    || code === 0xfe52 // ﹒ SMALL FULL STOP
    || code === 0x00b7 // · MIDDLE DOT
    || code === 0x2024 // ․ ONE DOT LEADER
    || code === 0x2025 // ‥ TWO DOT LEADER
    || code === 0x3002 // 。 IDEOGRAPHIC FULL STOP
    || code === 0x06d4 // ۔ ARABIC FULL STOP
    || code === 0x0387 // · GREEK ANO TELEIA
    || code === 0x2027 // ‧ HYPHENATION POINT
    || code === 0x22c5 // ⋅ DOT OPERATOR
    || code === 0x2219 // ∙ BULLET OPERATOR
    || code === 0x1362 // ። ETHIOPIC FULL STOP
    || code === 0x05c3 // ׃ HEBREW PUNCTUATION SOF PASUQ
    || code === 0x2e31 // ⸱ WORD SEPARATOR MIDDLE DOT
    || code === 0x2e33 // ⸳ RAISED DOT
    || code === 0x2981 // ⦁ Z NOTATION SPOT
    || code === 0x16eb // ᛫ RUNIC SINGLE PUNCTUATION
    || code === 0x1427 // ᐧ CANADIAN SYLLABICS FINAL MIDDLE DOT
    || code === 0x1803 // ᠃ MONGOLIAN FULL STOP
    || code === 0x166e // ᙮ CANADIAN SYLLABICS FULL STOP
    || code === 0x2e30 // ⸰ RING POINT
    || code === 0xa78f // ꞏ LATIN LETTER SINOLOGICAL DOT
    || code === 0x0701 // ܁ SYRIAC SUPRALINEAR FULL STOP
    || code === 0x0702 // ܂ SYRIAC SUBLINEAR FULL STOP
    || code === 0xff61 // ｡ HALFWIDTH IDEOGRAPHIC FULL STOP
    || code === 0xfe12 // ︒ PRESENTATION FORM FOR VERTICAL IDEOGRAPHIC FULL STOP
    || code === 0xfe30 // ︰ PRESENTATION FORM FOR VERTICAL TWO DOT LEADER
    || code === 0x30fb // ・ KATAKANA MIDDLE DOT
    || code === 0xff65
  ); // ･ HALFWIDTH KATAKANA MIDDLE DOT
}

function containsSlashHomoglyph(path: string): boolean {
  for (const ch of path) {
    if (isSlashHomoglyph(ch)) {
      return true;
    }
  }

  return false;
}

function containsDotHomoglyph(path: string): boolean {
  for (const ch of path) {
    if (isDotHomoglyph(ch)) {
      return true;
    }
  }

  return false;
}

function pathWithoutQueryOrFragment(path: string): string {
  const queryIndex = path.indexOf("?");
  const fragmentIndex = path.indexOf("#");
  let endIndex = path.length;

  if (queryIndex >= 0) {
    endIndex = queryIndex;
  }

  if (fragmentIndex >= 0 && fragmentIndex < endIndex) {
    endIndex = fragmentIndex;
  }

  return path.slice(0, endIndex);
}

function containsAtSignInPath(path: string): boolean {
  return pathWithoutQueryOrFragment(path).includes("@");
}

function containsDotDotSegment(path: string): boolean {
  const pathOnly = pathWithoutQueryOrFragment(path);

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

  if (containsSlashHomoglyph(normalized)) {
    return false;
  }

  if (containsDotHomoglyph(normalized)) {
    return false;
  }

  if (containsDotDotSegment(normalized)) {
    return false;
  }

  if (containsAtSignInPath(normalized)) {
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

    if (decoded.includes("://") || decoded.includes("\\")) {
      return false;
    }

    if (containsSlashHomoglyph(decoded)) {
      return false;
    }

    if (containsDotHomoglyph(decoded)) {
      return false;
    }

    if (containsDotDotSegment(decoded)) {
      return false;
    }

    if (containsAtSignInPath(decoded)) {
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

  if (containsSlashHomoglyph(working)) {
    return false;
  }

  if (containsDotHomoglyph(working)) {
    return false;
  }

  if (containsDotDotSegment(working)) {
    return false;
  }

  if (containsAtSignInPath(working)) {
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
