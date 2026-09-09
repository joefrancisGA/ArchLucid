import { resolveArchitectureReviewHref } from "@/lib/architecture/architecture-routes";
import { RUN_DETAIL_SECTION_TAB } from "@/lib/runs/run-detail-section-tab-map";
import { resolveUnifiedReviewWorkspaceTab, ARCH_TAB_TO_REVIEW_TAB } from "@/lib/unified-review-workspace-tabs";

export const REVIEW_DETAIL_TAB_PARAM = "reviewTab" as const;

export const REVIEW_DETAIL_FINDING_PARAM = "findingId" as const;

export const REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM = "workbenchFocus" as const;

export const REVIEW_WORKBENCH_FOCUS_COLUMN_IDS = ["architecture", "findings", "evidence"] as const;

export type ReviewWorkbenchFocusColumnId = (typeof REVIEW_WORKBENCH_FOCUS_COLUMN_IDS)[number];

export function isReviewWorkbenchFocusColumnId(
  value: string | null | undefined,
): value is ReviewWorkbenchFocusColumnId {
  if (value === null || value === undefined || value.trim().length === 0) {
    return false;
  }

  return (REVIEW_WORKBENCH_FOCUS_COLUMN_IDS as readonly string[]).includes(value);
}

export function resolveReviewWorkbenchFocusColumn(
  paramValue: string | null | undefined,
): ReviewWorkbenchFocusColumnId | null {
  if (isReviewWorkbenchFocusColumnId(paramValue)) {
    return paramValue;
  }

  return null;
}

export function readPresenterModeFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
): boolean {
  return searchParams.get("presenter") === "1";
}

export function readPresenterModeFromWindowLocation(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return readPresenterModeFromSearchParams(new URLSearchParams(window.location.search));
}

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
  "review-package": "Finalized review record",
  architecture: "Architecture",
  activity: "Activity",
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

export function resolveReviewDetailTabFromLocation(
  reviewTabValue: string | null | undefined,
  archTabValue: string | null | undefined,
): ReviewDetailTabId {
  return resolveUnifiedReviewWorkspaceTab(reviewTabValue, archTabValue);
}

export function resolveReviewDetailTabFromHash(hash: string | null | undefined): ReviewDetailTabId | null {
  if (hash === null || hash === undefined) {
    return null;
  }

  const normalized = hash.replace(/^#/, "").trim();

  if (normalized.length === 0) {
    return null;
  }

  return RUN_DETAIL_SECTION_TAB[normalized] ?? null;
}

export function buildReviewDetailTabHref(
  runId: string,
  tab: ReviewDetailTabId,
  options?: {
    readonly hash?: string | null;
    readonly findingId?: string | null;
    readonly workbenchFocus?: ReviewWorkbenchFocusColumnId | null;
    readonly presenter?: boolean;
    /** Working nested review workspace base when architecture id is known (AO-33). */
    readonly architectureId?: string | null;
  },
): string {
  const params = new URLSearchParams({ [REVIEW_DETAIL_TAB_PARAM]: tab });
  const findingId = options?.findingId?.trim() ?? "";

  if (findingId.length > 0) {
    params.set(REVIEW_DETAIL_FINDING_PARAM, findingId);
  }

  if (options?.workbenchFocus !== undefined && options.workbenchFocus !== null) {
    params.set(REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM, options.workbenchFocus);
  }

  if (options?.presenter === true) {
    params.set("presenter", "1");
  }

  const base = `${resolveArchitectureReviewHref(runId.trim(), options?.architectureId)}?${params.toString()}`;
  const hash = options?.hash?.trim() ?? "";

  if (hash.length === 0) {
    return base;
  }

  const normalizedHash = hash.startsWith("#") ? hash : `#${hash}`;

  return `${base}${normalizedHash}`;
}

/** Updates `reviewTab` in the address bar without a Next.js soft navigation. */
export function writeReviewDetailTabToUrl(
  tab: ReviewDetailTabId,
  options?: {
    readonly hash?: string | null;
    readonly findingId?: string | null;
    readonly workbenchFocus?: ReviewWorkbenchFocusColumnId | null;
    readonly presenter?: boolean | null;
  },
): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set(REVIEW_DETAIL_TAB_PARAM, tab);

  if (options?.findingId === null) {
    url.searchParams.delete(REVIEW_DETAIL_FINDING_PARAM);
  } else if (options?.findingId !== undefined) {
    const trimmed = options.findingId.trim();

    if (trimmed.length > 0) {
      url.searchParams.set(REVIEW_DETAIL_FINDING_PARAM, trimmed);
    } else {
      url.searchParams.delete(REVIEW_DETAIL_FINDING_PARAM);
    }
  }

  if (options?.workbenchFocus === null) {
    url.searchParams.delete(REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM);
  } else if (options?.workbenchFocus !== undefined) {
    url.searchParams.set(REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM, options.workbenchFocus);
  }

  if (options?.presenter === null) {
    url.searchParams.delete("presenter");
  } else if (options?.presenter === true) {
    url.searchParams.set("presenter", "1");
  }

  if (options?.hash === null) {
    url.hash = "";
  } else if (options?.hash !== undefined) {
    const normalized = options.hash.replace(/^#/, "").trim();
    url.hash = normalized.length > 0 ? `#${normalized}` : "";
  }

  window.history.replaceState(null, "", url.toString());
}

/** Reads the active review tab from the current browser location. */
export function readReviewDetailTabFromWindowLocation(): ReviewDetailTabId {
  if (typeof window === "undefined") {
    return REVIEW_DETAIL_DEFAULT_TAB;
  }

  const fromHash = resolveReviewDetailTabFromHash(window.location.hash.slice(1));

  if (fromHash !== null) {
    return fromHash;
  }

  return resolveReviewDetailTabFromLocation(
    new URLSearchParams(window.location.search).get(REVIEW_DETAIL_TAB_PARAM),
    new URLSearchParams(window.location.search).get("archTab"),
  );
}

export function readReviewDetailTabFromHref(href: string): ReviewDetailTabId | null {
  try {
    const url = new URL(href, "http://archlucid.local");
    const fromHash = resolveReviewDetailTabFromHash(url.hash.slice(1));

    if (fromHash !== null) {
      return fromHash;
    }

    const fromParam = url.searchParams.get(REVIEW_DETAIL_TAB_PARAM);
    const fromArch = url.searchParams.get("archTab");
    const hasArchTab =
      fromArch !== null
      && fromArch.trim().length > 0
      && (Object.keys(ARCH_TAB_TO_REVIEW_TAB) as readonly string[]).includes(fromArch);

    if (!isReviewDetailTabId(fromParam) && !hasArchTab) {
      return null;
    }

    return resolveReviewDetailTabFromLocation(fromParam, fromArch);
  } catch {
    return null;
  }
}
