export const REVIEW_DETAIL_TAB_PARAM = "reviewTab" as const;

export const REVIEW_DETAIL_TAB_IDS = [
  "overview",
  "findings",
  "evidence",
  "policies",
  "decisions-remediation",
  "review-package",
  "architecture",
  "activity",
] as const;

export type ReviewDetailTabId = (typeof REVIEW_DETAIL_TAB_IDS)[number];

export const REVIEW_DETAIL_DEFAULT_TAB: ReviewDetailTabId = "overview";

export const REVIEW_DETAIL_TAB_LABELS: Record<ReviewDetailTabId, string> = {
  overview: "Overview",
  findings: "Findings",
  evidence: "Evidence",
  policies: "Policies and standards",
  "decisions-remediation": "Decisions and remediation",
  "review-package": "Signed review record",
  architecture: "Architecture",
  activity: "Activity",
};

const LEGACY_HASH_TO_TAB: Readonly<Record<string, ReviewDetailTabId>> = {
  "run-explanation": "findings",
  "capture-evidence": "evidence",
  "artifacts-exports": "evidence",
  "governance-decision": "decisions-remediation",
  "recommended-actions": "overview",
  "review-package": "review-package",
  "submitted-architecture": "architecture",
  "manifest-summary": "policies",
  "pipeline-timeline": "activity",
  "architecture-assessment-progress": "activity",
  "architecture-graph": "activity",
  "authority-chain": "activity",
  "run-actions": "review-package",
};

export function isReviewDetailTabId(value: string | null | undefined): value is ReviewDetailTabId {
  if (value === null || value === undefined || value.trim().length === 0) {
    return false;
  }

  return (REVIEW_DETAIL_TAB_IDS as readonly string[]).includes(value);
}

export function resolveReviewDetailTab(paramValue: string | null | undefined): ReviewDetailTabId {
  if (isReviewDetailTabId(paramValue)) {
    return paramValue;
  }

  return REVIEW_DETAIL_DEFAULT_TAB;
}

export function resolveReviewDetailTabFromHash(hash: string | null | undefined): ReviewDetailTabId | null {
  if (hash === null || hash === undefined) {
    return null;
  }

  const normalized = hash.replace(/^#/, "").trim();

  if (normalized.length === 0) {
    return null;
  }

  return LEGACY_HASH_TO_TAB[normalized] ?? null;
}

export function buildReviewDetailTabHref(
  runId: string,
  tab: ReviewDetailTabId,
  options?: { readonly hash?: string | null },
): string {
  const params = new URLSearchParams({ [REVIEW_DETAIL_TAB_PARAM]: tab });
  const base = `/reviews/${encodeURIComponent(runId.trim())}?${params.toString()}`;
  const hash = options?.hash?.trim() ?? "";

  if (hash.length === 0) {
    return base;
  }

  const normalizedHash = hash.startsWith("#") ? hash : `#${hash}`;

  return `${base}${normalizedHash}`;
}

export function readReviewDetailTabFromHref(href: string): ReviewDetailTabId | null {
  try {
    const url = new URL(href, "http://archlucid.local");
    const fromHash = resolveReviewDetailTabFromHash(url.hash.slice(1));

    if (fromHash !== null) {
      return fromHash;
    }

    const fromParam = url.searchParams.get(REVIEW_DETAIL_TAB_PARAM);

    if (isReviewDetailTabId(fromParam)) {
      return fromParam;
    }

    return null;
  } catch {
    return null;
  }
}
