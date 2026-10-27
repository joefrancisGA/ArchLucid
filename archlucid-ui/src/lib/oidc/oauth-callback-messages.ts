/**
 * User-facing wording for OAuth2 authorize callback (?error=&error_description=)
 * — avoids leaking internals while staying accurate for admins.
 */

const OAUTH_INVISIBLE_FORMAT_CHARS = /[\u200B-\u200D\u2060\uFEFF]/gu;

/** Accidental Latin copy/paste separators — not ZWNJ (U+200C) or ZWJ (U+200D) used in Persian/Indic and emoji. */
const OIDC_DISPLAY_GLUE_FORMAT_CHARS = /[\u200B\u2060\uFEFF]/gu;

export function stripOAuthInvisibleFormatChars(text: string): string {
  return text.replace(OAUTH_INVISIBLE_FORMAT_CHARS, "");
}

/** Trims deployment configuration strings and removes zero-width format characters. */
export function normalizeOidcConfigurationString(value: string): string {
  return stripOAuthInvisibleFormatChars(value.trim()).trim();
}

/** Normalizes human-readable OIDC claim copy (names, titles) for session display. */
export function normalizeOidcDisplayString(value: string): string {
  return value
    .replace(OIDC_DISPLAY_GLUE_FORMAT_CHARS, " ")
    .replace(/[\u0000-\u001F\u007F\u2028\u2029\u0085]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

/** Normalizes opaque OAuth strings (PKCE state, nonce claims) before equality checks. */
export function normalizeOidcOpaqueOAuthString(value: string): string {
  return normalizeOidcDisplayString(stripOAuthInvisibleFormatChars(value.trim()).trim());
}

/** Collapses accidental C0 padding on authorize `?error=` codes before snake_case classification. */
export function normalizeAuthorizeCallbackErrorCode(errorCode: string): string {
  return collapseOAuthErrorDescriptionLineBreaks(errorCode.trim());
}

function isOAuthInvisibleFormatChar(char: string): boolean {
  if (char.length === 0) {
    return false;
  }

  const code = char.charCodeAt(0);

  return code === 0x200b || code === 0x200c || code === 0x200d || code === 0x2060 || code === 0xfeff;
}

/**
 * Normalizes numeric OIDC/BFF hints (`expires_in`, `expires_at_ms`) by trimming and
 * stripping invisible format characters at the edges only — interior ZWSP must not
 * merge digits (e.g. `1730\u200b000` → `1730000`).
 */
export function normalizeNumericOidcHintString(value: string): string {
  let start = 0;
  let end = value.length;

  while (start < end) {
    const char = value[start];

    if (!isOAuthInvisibleFormatChar(char) && char.trim().length > 0) {
      break;
    }

    start += 1;
  }

  while (end > start) {
    const char = value[end - 1];

    if (!isOAuthInvisibleFormatChar(char) && char.trim().length > 0) {
      break;
    }

    end -= 1;
  }

  return value.slice(start, end);
}

const NON_DECIMAL_OIDC_NUMERIC_PREFIX = /^0[xXbBoO]/u;

/** OAuth access-token lifetimes above one year; shared with `resolve-expires-in-seconds`. */
export const MAX_PLAUSIBLE_OIDC_EXPIRES_IN_SEC = 31_536_000;

/** Rejects unsafe-integer and implausibly far-future epoch-ms hints (string or JSON number paths). */
export function coerceAcceptedOidcEpochMsHint(parsed: number): number {
  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  const truncatedEpochMs = Math.trunc(parsed);

  if (!Number.isSafeInteger(truncatedEpochMs)) {
    return Number.NaN;
  }

  const maxPlausibleEpochMs = Date.now() + MAX_PLAUSIBLE_OIDC_EXPIRES_IN_SEC * 1000;

  if (truncatedEpochMs < 0 || truncatedEpochMs > maxPlausibleEpochMs) {
    return Number.NaN;
  }

  return truncatedEpochMs;
}

/** Parses epoch-ms hints from sessionStorage or BFF refresh JSON; rejects hex/binary/octal literals. */
export function parseOidcEpochMsHint(value: string): number {
  const normalized = normalizeNumericOidcHintString(value);

  if (normalized.length === 0) {
    return Number.NaN;
  }

  if (NON_DECIMAL_OIDC_NUMERIC_PREFIX.test(normalized)) {
    return Number.NaN;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  return coerceAcceptedOidcEpochMsHint(parsed);
}

/** ZWNJ/ZWJ between Latin tokens is usually accidental paste glue; keep joiners inside Persian/Arabic copy and emoji. */
function collapseAccidentalLatinZwnjGlue(text: string): string {
  return text.replace(/(?<=[A-Za-z0-9])[\u200c\u200d](?=[A-Za-z0-9])/gu, " ");
}

const MAX_OAUTH_PERCENT_DECODE_PASSES = 3;

/** True when the string carries OAuth-style percent-encoded plus (`%2B`, including multiply-encoded `%252B`). */
function includesPercentEncodedPlus(value: string): boolean {
  return /%(?:25)*2[bB]/i.test(value);
}

/** Authorize query copy may mix literal plus with spaces or zero-width glue (ZWSP is not matched by `\s`). */
function shouldPreserveLiteralPlusInAuthorizeDescription(decoded: string): boolean {
  if (!decoded.includes("+")) {
    return false;
  }

  if (/\s/u.test(decoded)) {
    return true;
  }

  if (OIDC_DISPLAY_GLUE_FORMAT_CHARS.test(decoded)) {
    return true;
  }

  // Family emoji uses ZWJ (U+200D); flag emoji uses regional indicators — neither matches ZWSP glue above.
  if (/\u200d/u.test(decoded)) {
    return true;
  }

  if (/\p{Regional_Indicator}/u.test(decoded)) {
    return true;
  }

  // Fitzpatrick skin-tone modifiers (U+1F3FB–U+1F3FF) follow base emoji without ZWJ — mirror flag/ZWJ plus preservation.
  if (/\p{Emoji_Modifier}/u.test(decoded)) {
    return true;
  }

  // Keycap emoji (#️⃣, 1️⃣) uses U+FE0F + U+20E3 without ZWJ or Fitzpatrick modifiers.
  if (/\u20e3/u.test(decoded)) {
    return true;
  }

  // Presentation emoji (🏷️, ⚠️) and other pictographs without the glue signals above.
  if (/\p{Extended_Pictographic}/u.test(decoded)) {
    return true;
  }

  return /(?<=[A-Za-z0-9])[\u200c\u200d](?=[A-Za-z0-9+])/u.test(decoded);
}

/** Some IdPs over-encode `error_description` (proxy chains); decode until stable, capped, without breaking literal `%` copy. */
function decodeRepeatedPercentEncoding(value: string): string {
  let current = value;

  for (let pass = 0; pass < MAX_OAUTH_PERCENT_DECODE_PASSES; pass += 1) {
    try {
      const next = decodeURIComponent(current);

      if (next === current) {
        break;
      }

      current = next;
    } catch {
      break;
    }
  }

  return current;
}

export function collapseOAuthErrorDescriptionLineBreaks(text: string): string {
  return collapseAccidentalLatinZwnjGlue(text)
    .replace(OIDC_DISPLAY_GLUE_FORMAT_CHARS, " ")
    // Soft hyphens are optional break points; on single-line callback copy they glue words (Policy\u00ADdenied).
    .replace(/[\u0000-\u001F\u007F\u2028\u2029\u0085\u00AD]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

/** Normalizes OAuth `error` codes from authorize query params or token JSON (collapse glue characters, snake_case). */
export function normalizeOAuthErrorCode(value: string): string {
  let decoded = value.trim();

  decoded = decodeRepeatedPercentEncoding(decoded.replace(/\+/g, " ")).replace(/\+/g, " ");

  const tokenized = decoded
    .replace(OAUTH_INVISIBLE_FORMAT_CHARS, "_")
    .replace(/[\u0000-\u001F\u007F\u2028\u2029\u0085\u00AD]/gu, "_");
  const collapsed = collapseOAuthErrorDescriptionLineBreaks(tokenized);

  return collapsed
    .replace(/\s+/gu, "_")
    .replace(/_+/gu, "_")
    .trim()
    .toLowerCase();
}

export function decodeOAuthErrorDescription(encoded: string | null | undefined): string {
  if (encoded === null || encoded === undefined) {
    return "";
  }

  const trimmed = encoded.trim();

  if (trimmed.length === 0) {
    return "";
  }

  let decoded: string;

  try {
    decoded = decodeRepeatedPercentEncoding(trimmed);

    if (!shouldPreserveLiteralPlusInAuthorizeDescription(decoded)) {
      decoded = decoded.replace(/\+/g, " ");
    }

    decoded = collapseOAuthErrorDescriptionLineBreaks(decoded);
  } catch {
    let fallback = trimmed;

    if (!shouldPreserveLiteralPlusInAuthorizeDescription(fallback)) {
      fallback = fallback.replace(/\+/g, " ");
    }

    decoded = collapseOAuthErrorDescriptionLineBreaks(fallback);
  }

  return readableOAuthErrorDetailOrEmpty(decoded);
}

/**
 * RFC 6749 token JSON carries plain-text `error_description` (not query encoding).
 * Tolerate mistaken %-escapes from some IdPs; on decode failure keep the raw string.
 * Does not treat literal `+` as space; mistaken `%2B` escapes in JSON are collapsed after decode.
 */
export function readOAuthJsonErrorDescription(value: string): string {
  const collapsed = collapseOAuthErrorDescriptionLineBreaks(value.trim());

  if (collapsed.length === 0) {
    return "";
  }

  const percentEncodedPlus = includesPercentEncodedPlus(collapsed);
  const literalPlusInSource = collapsed.includes("+");
  let decoded: string;

  try {
    if (percentEncodedPlus && literalPlusInSource) {
      const fullyDecoded = decodeRepeatedPercentEncoding(collapsed);

      decoded = shouldPreserveLiteralPlusInAuthorizeDescription(fullyDecoded)
        ? fullyDecoded
        : decodeRepeatedPercentEncoding(collapsed.replace(/%(?:25)*2[bB]/gi, " "));

      decoded = collapseOAuthErrorDescriptionLineBreaks(decoded);
    } else {
      decoded = decodeRepeatedPercentEncoding(collapsed);

      if (percentEncodedPlus && !literalPlusInSource && !shouldPreserveLiteralPlusInAuthorizeDescription(decoded)) {
        decoded = decoded.replace(/\+/g, " ");
      }

      decoded = collapseOAuthErrorDescriptionLineBreaks(decoded);
    }
  } catch {
    decoded = collapsed;
  }

  return readableOAuthErrorDetailOrEmpty(decoded);
}

function isBrokenJavascriptObjectCoercionDetail(detail: string): boolean {
  return /^\[object\s+[^\]]+\]$/i.test(detail.trim());
}

function readableOAuthErrorDetailOrEmpty(decoded: string): string {
  if (!isReadableOAuthErrorDetail(decoded)) {
    return "";
  }

  if (isBrokenJavascriptObjectCoercionDetail(decoded)) {
    return "";
  }

  if (isPlaceholderOAuthErrorCodeLiteral(decoded.trim().toLowerCase())) {
    return "";
  }

  return decoded;
}

function formatErrorCodeForReading(errorCode: string): string {
  return errorCode
    .replace(/_/g, " ")
    .replace(OAUTH_INVISIBLE_FORMAT_CHARS, "")
    .trim();
}

function containsReadableOAuthCharacters(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

function containsReadableOAuthDetailCharacters(text: string): boolean {
  return /[\p{L}\p{N}\p{Extended_Pictographic}]/u.test(text);
}

function containsRegionalIndicatorFlagSequence(text: string): boolean {
  return /(?:\p{Regional_Indicator}{2})+/u.test(text);
}

/** True when an OAuth `error` query/code value is not underscore/invisible padding. */
export function isReadableOAuthErrorCode(errorCode: string): boolean {
  const formatted = formatErrorCodeForReading(errorCode);

  return formatted.length > 0 && containsReadableOAuthCharacters(formatted);
}

/** True when a string is the usual `String(object)` serialization artifact (`[object Object]`, etc.). */
export function isJavascriptObjectCoercionOAuthLiteral(value: string): boolean {
  const trimmed = normalizeOAuthErrorMetadataString(value);

  return /^\[object(?:\s+|_)[^\]]+\]$/i.test(trimmed);
}

/** True when an OAuth `error` query or JSON value is object-coercion garbage (bracket or normalized snake_case). */
export function isObjectCoercionOAuthErrorValue(value: string): boolean {
  const trimmed = normalizeOAuthErrorMetadataString(value);

  if (isJavascriptObjectCoercionOAuthLiteral(trimmed)) {
    return true;
  }

  const normalized = normalizeOAuthErrorCode(trimmed);

  // Normalized `String(value)` tags become `object_<tag>` (not only the five legacy literals).
  return /^object_[a-z0-9_]+$/i.test(normalized);
}

/** Trim and strip invisible format characters from raw OAuth `error` JSON or query values. */
export function normalizeOAuthErrorMetadataString(value: string): string {
  return stripOAuthInvisibleFormatChars(value.trim()).normalize("NFKC").trim();
}

/** Signed or unsigned `Infinity` / `NaN` serialization placeholders from IdP or proxy JSON. */
export function isNonFiniteNumericOAuthErrorPlaceholder(value: string): boolean {
  const collapsed = normalizeOAuthErrorMetadataString(value).toLowerCase();

  return (
    /^[+-]?(?:infinity|nan)$/u.test(collapsed) || collapsed === "\u221e" || collapsed === "∞"
  );
}

/** JSON or query `error` / detail values that are readable but not real IdP copy (serialization placeholders). */
export function isPlaceholderOAuthErrorCodeLiteral(normalizedErrorCode: string): boolean {
  const collapsed = normalizeOAuthErrorMetadataString(normalizedErrorCode).toLowerCase();

  return (
    collapsed === "null" ||
    collapsed === "undefined" ||
    isNonFiniteNumericOAuthErrorPlaceholder(collapsed) ||
    collapsed === "true" ||
    collapsed === "false" ||
    collapsed === "[object_object]"
  );
}

/** True when an OAuth `error_uri` query or JSON field is non-empty and not a serialization placeholder. */
export function isUsableOAuthErrorUriValue(raw: unknown): boolean {
  if (typeof raw !== "string") {
    return false;
  }

  const normalized = normalizeOidcConfigurationString(raw);

  if (normalized.length === 0) {
    return false;
  }

  if (isJavascriptObjectCoercionOAuthLiteral(normalized)) {
    return false;
  }

  return !isPlaceholderOAuthErrorCodeLiteral(normalized.toLowerCase());
}

function isReadableOAuthErrorDetail(detail: string): boolean {
  const normalized = detail
    .replace(OIDC_DISPLAY_GLUE_FORMAT_CHARS, " ")
    .replace(/_/g, " ")
    .replace(/\s+/gu, " ")
    .trim();

  if (normalized.length === 0) {
    return false;
  }

  if (containsReadableOAuthCharacters(normalized)) {
    return true;
  }

  // Emoji-only glyphs (e.g. 🔒) are not actionable detail; ZWJ sequences (family emoji) are.
  if (detail.includes("\u200d") && containsReadableOAuthDetailCharacters(normalized)) {
    return true;
  }

  if (containsRegionalIndicatorFlagSequence(normalized)) {
    return true;
  }

  return false;
}

const MAX_OAUTH_USER_FACING_MESSAGE_LENGTH = 280;

function truncateOAuthUserFacingMessage(text: string): string {
  if (text.length <= MAX_OAUTH_USER_FACING_MESSAGE_LENGTH) {
    return text;
  }

  let cutIndex = MAX_OAUTH_USER_FACING_MESSAGE_LENGTH - 1;

  if (cutIndex > 0) {
    const codeUnitBeforeCut = text.charCodeAt(cutIndex - 1);

    // Avoid ending operator-facing copy on a high surrogate without its pair.
    if (codeUnitBeforeCut >= 0xd800 && codeUnitBeforeCut <= 0xdbff) {
      cutIndex -= 1;
    }
  }

  return `${text.slice(0, cutIndex)}…`;
}

/** Collapses line breaks and caps length for authorize-callback and token-endpoint operator copy. */
export function sanitizeOAuthUserFacingMessage(text: string): string {
  return truncateOAuthUserFacingMessage(collapseOAuthErrorDescriptionLineBreaks(text));
}

/** Maps standard OAuth authorize errors to actionable copy for the SPA callback route. */
function buyerSafeAuthorizeErrorWithoutCode(detail: string): string {
  if (detail.length > 0) {
    return sanitizeOAuthUserFacingMessage(`Sign-in did not finish: ${detail}`);
  }

  return "We did not receive a complete response from your identity provider. Start sign-in again.";
}

export function humanizeAuthorizeCallbackError(errorCode: string, decodedDescription: string): string {
  const normalized = normalizeOAuthErrorCode(normalizeAuthorizeCallbackErrorCode(errorCode));
  const sanitizedDetail = sanitizeOAuthUserFacingMessage(decodedDescription);
  const detail = isReadableOAuthErrorDetail(sanitizedDetail) ? sanitizedDetail : "";
  const readableCode = formatErrorCodeForReading(normalized);

  if (!isReadableOAuthErrorCode(normalized)) {
    return buyerSafeAuthorizeErrorWithoutCode(detail);
  }

  switch (normalized) {
    case "access_denied":
      return detail.length > 0
        ? sanitizeOAuthUserFacingMessage(`Sign-in stopped: ${detail}`)
        : "You canceled sign-in or your organization declined access. Try again if that was unintentional.";
    case "login_required":
    case "interaction_required":
      return "Another sign-in step is required. Try signing in again and complete any prompts from your identity provider.";
    case "consent_required":
      return "Your organization requires administrator consent for this app. Contact IT, then try again.";
    case "invalid_request":
      return detail.length > 0
        ? sanitizeOAuthUserFacingMessage(
            `This sign-in request was not valid (${detail}). Try signing in again.`,
          )
        : "This sign-in request was not valid. Try signing in again.";
    case "unauthorized_client":
      return "This sign-in route is not enabled for your identity provider registration. Contact your ArchLucid account team.";
    case "invalid_scope":
      return "The requested permissions are not available on this tenant. Contact your ArchLucid account team.";
    case "server_error":
    case "temporarily_unavailable":
      return "Your identity provider reported a temporary error. Wait a minute and try signing in again.";
    default:
      if (detail.length > 0) {
        return sanitizeOAuthUserFacingMessage(`${readableCode}: ${detail}`);
      }

      return sanitizeOAuthUserFacingMessage(
        `Sign-in did not finish (${readableCode}). Try again, or contact support if this persists.`,
      );
  }
}
