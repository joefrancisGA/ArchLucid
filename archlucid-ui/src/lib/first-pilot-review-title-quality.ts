import { isUnusableReviewTitleCandidate } from "@/lib/review-display-title";

/** Placeholder-quality example: system plus a named decision or change. */
export const FIRST_PILOT_REVIEW_TITLE_QUALITY_EXAMPLE = "Retail API modernization review";

const BANNED_ACTIVITY_TITLES = new Set([
  "architecture review",
  "test review",
  "untitled",
  "weekly review",
  "test",
  "demo",
  "tmp",
]);

const DECISION_TOKENS = [
  "modernization",
  "modernise",
  "modernize",
  "retire",
  "replace",
  "migrate",
  "migration",
  "upgrade",
  "decommission",
  "expand",
  "consolidate",
  "move",
  "add ",
] as const;

const TITLE_SPLIT_PATTERN = /\s[—–:]\s|\s-\s/;

function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

function isBannedActivityTitle(normalized: string): boolean {
  return BANNED_ACTIVITY_TITLES.has(normalized.toLowerCase());
}

function hasSystemAndDecision(normalized: string): boolean {
  const parts = normalized
    .split(TITLE_SPLIT_PATTERN)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length >= 2) {
    return true;
  }

  const lower = normalized.toLowerCase();

  return DECISION_TOKENS.some((token) => lower.includes(token));
}

/** Minimum trimmed title length for evidence-backed quick start (brief-only path uses system+decision). */
export const FIRST_PILOT_EVIDENCE_BACKED_MIN_TITLE_CHARS = 2;

/** True when the review title names a system and a decision, not an activity placeholder. */
export function isFirstPilotReviewTitleAcceptable(title: string): boolean {
  const normalized = normalizeTitle(title);

  if (normalized.length === 0) {
    return false;
  }

  if (isUnusableReviewTitleCandidate(normalized)) {
    return false;
  }

  if (isBannedActivityTitle(normalized)) {
    return false;
  }

  return hasSystemAndDecision(normalized);
}

/**
 * Evidence-backed quick start only needs a non-placeholder title — attached files carry the architecture context.
 * Brief-only intake still requires {@link isFirstPilotReviewTitleAcceptable}.
 */
export function isFirstPilotReviewTitleAcceptableWithEvidence(title: string): boolean {
  const normalized = normalizeTitle(title);

  if (normalized.length < FIRST_PILOT_EVIDENCE_BACKED_MIN_TITLE_CHARS) {
    return false;
  }

  if (isUnusableReviewTitleCandidate(normalized)) {
    return false;
  }

  if (isBannedActivityTitle(normalized)) {
    return false;
  }

  return true;
}

export function isFirstPilotReviewTitleReady(
  title: string,
  options: { readonly evidenceAttached: boolean },
): boolean {
  if (options.evidenceAttached) {
    return isFirstPilotReviewTitleAcceptableWithEvidence(title);
  }

  return isFirstPilotReviewTitleAcceptable(title);
}

/** Field error when the title is empty, banned, or missing a system + decision. */
export function describeFirstPilotReviewTitleGap(
  title: string,
  options?: { readonly evidenceAttached?: boolean },
): string | null {
  const evidenceAttached = options?.evidenceAttached === true;

  if (isFirstPilotReviewTitleReady(title, { evidenceAttached })) {
    return null;
  }

  const normalized = normalizeTitle(title);

  if (normalized.length === 0) {
    return evidenceAttached
      ? "Add a review title before starting."
      : "Add a review title that names the system and the decision.";
  }

  if (isBannedActivityTitle(normalized) || isUnusableReviewTitleCandidate(normalized)) {
    return evidenceAttached
      ? `Use a specific review title instead of a placeholder, for example “${FIRST_PILOT_REVIEW_TITLE_QUALITY_EXAMPLE}”.`
      : `Use a title that names the system and the decision, for example “${FIRST_PILOT_REVIEW_TITLE_QUALITY_EXAMPLE}”.`;
  }

  if (evidenceAttached) {
    return `Add a review title with at least ${FIRST_PILOT_EVIDENCE_BACKED_MIN_TITLE_CHARS} characters.`;
  }

  return `Name the system and the decision in the title, for example “${FIRST_PILOT_REVIEW_TITLE_QUALITY_EXAMPLE}”.`;
}
