/**
 * Whether a listed question should be treated as expired for queue chrome.
 * List payloads may carry a stale `isExpired: false` while `expirationUtc` is already in the past.
 */
export function secureNowQuestionShowsExpired(
  expirationUtc: string | null | undefined,
  isExpired: boolean | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (isExpired === true) {
    return true;
  }

  if (expirationUtc === null || expirationUtc === undefined) {
    return false;
  }

  const trimmed = expirationUtc.trim();
  if (trimmed.length === 0) {
    return false;
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return false;
  }

  return parsed <= nowMs;
}

/**
 * Whether a mutation POST disposition contradicts itself: `isExpired` is true while
 * `expirationUtc` is missing, unparsable, or still in the future.
 */
export function secureNowQuestionDispositionPostExpirationContradicts(
  expirationUtc: string,
  isExpired: boolean,
  nowMs: number = Date.now(),
): boolean {
  if (!isExpired) {
    return false;
  }

  const trimmed = expirationUtc.trim();
  if (trimmed.length === 0) {
    return true;
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return true;
  }

  return parsed > nowMs;
}

/**
 * Whether a mutation POST disposition under-reports expiry: `isExpired` is false while
 * `expirationUtc` is already in the past. List payloads may keep stale false flags; fresh
 * POST saves should not.
 */
export function secureNowQuestionDispositionPostExpirationUnderReports(
  expirationUtc: string,
  isExpired: boolean,
  nowMs: number = Date.now(),
): boolean {
  if (isExpired) {
    return false;
  }

  const trimmed = expirationUtc.trim();
  if (trimmed.length === 0) {
    return false;
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return false;
  }

  return parsed <= nowMs;
}

/** Whether a non-blank mutation POST expiration string does not parse as a UTC timestamp. */
export function secureNowQuestionDispositionPostExpirationTimestampUnparsable(
  expirationUtc: string,
): boolean {
  const trimmed = expirationUtc.trim();
  if (trimmed.length === 0) {
    return false;
  }

  return Number.isNaN(Date.parse(trimmed));
}

/**
 * Whether a closed (answered/dismissed) mutation POST disposition fails expiration usability:
 * missing expiry, unparsable expiry, contradictory flags, or under-reported expiry.
 */
export function secureNowQuestionDispositionPostExpirationFailsClosedStatusGate(
  expirationUtc: string,
  isExpired: boolean,
  nowMs: number = Date.now(),
): boolean {
  if (expirationUtc.trim().length === 0) {
    return true;
  }

  if (secureNowQuestionDispositionPostExpirationTimestampUnparsable(expirationUtc)) {
    return true;
  }

  return secureNowQuestionDispositionPostExpirationContradicts(expirationUtc, isExpired, nowMs)
    || secureNowQuestionDispositionPostExpirationUnderReports(expirationUtc, isExpired, nowMs);
}

export function secureNowQuestionReviewerExpirationUtcStamp(
  expirationUtc: string | null | undefined,
): string | null {
  if (expirationUtc === null || expirationUtc === undefined) {
    return null;
  }

  const trimmed = expirationUtc.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (secureNowQuestionDispositionPostExpirationTimestampUnparsable(trimmed)) {
    return null;
  }

  return trimmed;
}

/** Reviewer-facing expiration line for SecureNow question details. */
export function secureNowQuestionReviewerExpirationDisplayLine(
  expirationUtc: string | null | undefined,
): string {
  const stamp = secureNowQuestionReviewerExpirationUtcStamp(expirationUtc);
  if (stamp !== null) {
    return `Expiration: ${stamp}`;
  }

  if (expirationUtc === null || expirationUtc === undefined) {
    return "Expiration was not stored.";
  }

  if (expirationUtc.trim().length === 0) {
    return "Expiration was stored empty.";
  }

  return "Expiration was not a readable time.";
}
