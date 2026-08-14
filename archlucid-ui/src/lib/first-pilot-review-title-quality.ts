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

/** Field error when the title is empty, banned, or missing a system + decision. */
export function describeFirstPilotReviewTitleGap(title: string): string | null {
  if (isFirstPilotReviewTitleAcceptable(title)) {
    return null;
  }

  const normalized = normalizeTitle(title);

  if (normalized.length === 0) {
    return "Add a review title that names the system and the decision.";
  }

  if (isBannedActivityTitle(normalized) || isUnusableReviewTitleCandidate(normalized)) {
    return `Use a title that names the system and the decision, for example “${FIRST_PILOT_REVIEW_TITLE_QUALITY_EXAMPLE}”.`;
  }

  return `Name the system and the decision in the title, for example “${FIRST_PILOT_REVIEW_TITLE_QUALITY_EXAMPLE}”.`;
}
