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

export function secureNowQuestionReviewerExpirationUtcStamp(
  expirationUtc: string | null | undefined,
): string | null {
  if (expirationUtc === null || expirationUtc === undefined) {
    return null;
  }

  const trimmed = expirationUtc.trim();
  return trimmed.length > 0 ? trimmed : null;
}
