import type { ArchitectureWorkspaceTabId } from "@/lib/architecture/architecture-workspace-tabs";
import { resolveArchitectureReviewHref } from "@/lib/architecture/architecture-routes";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture/architecture-workflow-intent";
import { FROM_GENERATION_QUERY_KEY } from "@/lib/review-generation-handoff";
import {
  buildReviewDetailTabHref,
  isReviewDetailTabId,
  REVIEW_DETAIL_DEFAULT_TAB,
  REVIEW_DETAIL_TAB_PARAM,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";

/**
 * TB-2355 — Canonical review URL tab ids (`reviewTab`) with legacy `archTab` aliases.
 */

export const ARCH_TAB_TO_REVIEW_TAB: Readonly<Record<ArchitectureWorkspaceTabId, ReviewDetailTabId>> = {
  overview: "overview",
  diagram: "architecture",
  clarifications: "decisions-remediation",
  findings: "findings",
  evidence: "evidence",
  governance: "policies",
  activity: "activity",
};

export const REVIEW_TAB_TO_ARCH_TAB: Readonly<Record<ReviewDetailTabId, ArchitectureWorkspaceTabId>> = {
  overview: "overview",
  findings: "findings",
  evidence: "evidence",
  policies: "governance",
  "decisions-remediation": "clarifications",
  "review-package": "overview",
  architecture: "diagram",
  activity: "activity",
};

export function mapArchitectureTabToReviewTab(
  tab: ArchitectureWorkspaceTabId,
): ReviewDetailTabId {
  return ARCH_TAB_TO_REVIEW_TAB[tab];
}

export function mapReviewTabToArchitectureTab(
  tab: ReviewDetailTabId,
): ArchitectureWorkspaceTabId {
  return REVIEW_TAB_TO_ARCH_TAB[tab];
}

export function resolveUnifiedReviewWorkspaceTab(
  reviewTabValue: string | null | undefined,
  archTabValue: string | null | undefined,
): ReviewDetailTabId {
  if (isReviewDetailTabId(reviewTabValue)) {
    return reviewTabValue;
  }

  if (
    archTabValue !== null
    && archTabValue !== undefined
    && archTabValue.trim().length > 0
    && (Object.keys(ARCH_TAB_TO_REVIEW_TAB) as readonly string[]).includes(archTabValue)
  ) {
    return ARCH_TAB_TO_REVIEW_TAB[archTabValue as ArchitectureWorkspaceTabId];
  }

  return REVIEW_DETAIL_DEFAULT_TAB;
}

export function readUnifiedReviewWorkspaceTabFromSearchParams(
  params: URLSearchParams,
): ReviewDetailTabId {
  return resolveUnifiedReviewWorkspaceTab(
    params.get(REVIEW_DETAIL_TAB_PARAM),
    params.get("archTab"),
  );
}

export type BuildReviewWorkspaceTabHrefOptions = {
  /** Opt in when a deep link must mount create-home chrome (TB-1833). */
  readonly includeCreateIntent?: boolean;
  readonly hash?: string | null;
  /** Working nested review workspace base when architecture id is known (AO-33). */
  readonly architectureId?: string | null;
};

function appendHashToHref(href: string, hash: string | null | undefined): string {
  const trimmedHash = hash?.trim() ?? "";

  if (trimmedHash.length === 0) {
    return href;
  }

  const normalizedHash = trimmedHash.startsWith("#") ? trimmedHash : `#${trimmedHash}`;

  return `${href}${normalizedHash}`;
}

/** Canonical review workspace tab deep link — always emits `reviewTab` (TB-2363). */
export function buildReviewWorkspaceTabHref(
  runId: string,
  tab: ReviewDetailTabId,
  options?: BuildReviewWorkspaceTabHrefOptions,
): string {
  if (options?.includeCreateIntent === true) {
    const params = new URLSearchParams({
      [REVIEW_DETAIL_TAB_PARAM]: tab,
      [FROM_GENERATION_QUERY_KEY]: "1",
      intent: CREATE_ARCHITECTURE_INTENT,
    });
    const base = `${resolveArchitectureReviewHref(runId.trim(), options?.architectureId)}?${params.toString()}`;

    return appendHashToHref(base, options.hash);
  }

  return buildReviewDetailTabHref(runId, tab, {
    hash: options?.hash,
    architectureId: options?.architectureId,
  });
}

/** Create-home deep link from legacy archTab ids — emits `reviewTab` + create intent (TB-2363). */
export function buildCreateHomeReviewTabHref(
  runId: string,
  archTab: ArchitectureWorkspaceTabId,
  options?: Omit<BuildReviewWorkspaceTabHrefOptions, "includeCreateIntent">,
): string {
  return buildReviewWorkspaceTabHref(runId, mapArchitectureTabToReviewTab(archTab), {
    includeCreateIntent: true,
    hash: options?.hash,
  });
}
