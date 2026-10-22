import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import {
  architectureIdentityPath,
  architectureNestedSearchPath,
  startReviewFromArchitectureNestedHref,
} from "@/lib/architecture/architecture-routes";
import { WORKING_NEW_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import { GLOBAL_FIND_PAGE_SEARCH } from "@/lib/search-surface-disambiguation";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_SEARCH_BOUND_TO_OPEN_PACKAGE_DOC_ANCHOR =
  "docs/architecture/adrs/0079-working-desk-is-the-work-surface.md" as const;

export const SYSTEM_NOT_JOB_SEARCH_BOUND_TO_OPEN_PACKAGE_OWNER = "SN-026" as const;

/** SN-026 bind surfaces — nested search mount, peer honesty, header global copy. */
export const SYSTEM_NOT_JOB_WORKING_SEARCH_BIND_SURFACES: readonly string[] = [
  "archlucid-ui/src/lib/resolve-working-peer-search-redirect-href.ts",
  "archlucid-ui/src/components/insights/WorkingPeerSearchRedirect.tsx",
  "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/search/ArchitectureNestedSearchPageClient.tsx",
  "archlucid-ui/src/app/(operator)/insights/search-review-evidence/_sections/SearchPageView.tsx",
  "archlucid-ui/src/components/GlobalSearchBarShell.tsx",
  "archlucid-ui/src/app/(operator)/insights/search-review-evidence/_sections/search-page-copy.ts",
];

export const SYSTEM_NOT_JOB_WORKING_NESTED_SEARCH_UNBOUND_TITLE =
  "Open a review on this architecture" as const;

export const SYSTEM_NOT_JOB_WORKING_NESTED_SEARCH_UNBOUND_DESCRIPTION =
  "Desk search is bound to a sealed review on the architecture you have open — not a workspace-wide evidence console. Start or resume a review on the desk, then search indexed findings and decisions for this system." as const;

export const SYSTEM_NOT_JOB_WORKING_PEER_SEARCH_HONESTY_TITLE =
  "Workspace-wide evidence search" as const;

export const SYSTEM_NOT_JOB_WORKING_PEER_SEARCH_HONESTY_DESCRIPTION =
  "This page searches the evidence trail across every review in the workspace — a platform console, not the desk verb on your open architecture. Use the header find-a-page search (Ctrl+K) to jump routes; open an architecture desk for scoped search on one system." as const;

export const SYSTEM_NOT_JOB_WORKING_GLOBAL_FIND_PAGE_SEARCH_HELPER =
  `${GLOBAL_FIND_PAGE_SEARCH.helper} Header search finds pages and routes — it does not search the evidence trail. Use Search on an architecture desk for scoped evidence retrieval.` as const;

export type ResolveSystemNotJobWorkingPeerSearchRedirectHrefInput = {
  readonly pathname: string;
  readonly search?: string | null;
  readonly lastOpenArchitectureId?: string | null;
};

function trimmedArchitectureId(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function normalizeSearch(search: string | null | undefined): string {
  const trimmed = search?.trim() ?? "";

  if (trimmed.length === 0) {
    return "";
  }

  return trimmed.startsWith("?") ? trimmed : `?${trimmed}`;
}

/**
 * SN-026 / ADR 0079 — Working peer search redirects to nested search when architecture is known.
 * Unscoped Working keeps peer search as an explicit workspace console (SY-42 body).
 * Returns null when no redirect applies (Guided or non-search paths).
 */
export function resolveSystemNotJobWorkingPeerSearchRedirectHref(
  input: ResolveSystemNotJobWorkingPeerSearchRedirectHrefInput,
): string | null {
  const path = input.pathname.split("?")[0] ?? "";

  if (path !== SEARCH_REVIEW_EVIDENCE_PATH) {
    return null;
  }

  const architectureId = trimmedArchitectureId(input.lastOpenArchitectureId);

  if (architectureId.length === 0) {
    return null;
  }

  const nestedBase = architectureNestedSearchPath(architectureId);
  const search = normalizeSearch(input.search);

  if (search.length === 0) {
    return nestedBase;
  }

  return `${nestedBase}${search}`;
}

export type BuildSystemNotJobWorkingNestedSearchUnboundEmptyInput = {
  readonly architectureId: string;
  readonly architectureDisplayName?: string | null;
};

/** Nested desk search empty when architecture is open but no sealed review is bound (CD-02 — one New review, no sample CTA). */
export function buildSystemNotJobWorkingNestedSearchUnboundEmpty(
  input: BuildSystemNotJobWorkingNestedSearchUnboundEmptyInput,
): EnterpriseCompactEmptyStateProps {
  const architectureId = input.architectureId.trim();
  const architectureName = input.architectureDisplayName?.trim() ?? "";
  const label = architectureName.length > 0 ? architectureName : "this architecture";

  return {
    testId: "working-nested-search-unbound-empty-state",
    title: SYSTEM_NOT_JOB_WORKING_NESTED_SEARCH_UNBOUND_TITLE,
    description: SYSTEM_NOT_JOB_WORKING_NESTED_SEARCH_UNBOUND_DESCRIPTION,
    actions: [
      {
        label: `Open ${label}`,
        href: architectureIdentityPath(architectureId),
        variant: "primary",
      },
      {
        label: WORKING_NEW_REVIEW_LABEL,
        href: startReviewFromArchitectureNestedHref(architectureId),
        variant: "outline",
      },
    ],
  };
}

export function buildSystemNotJobWorkingPeerSearchHonestyEmpty(): EnterpriseCompactEmptyStateProps {
  return {
    testId: "working-peer-search-honesty-empty-state",
    title: SYSTEM_NOT_JOB_WORKING_PEER_SEARCH_HONESTY_TITLE,
    description: SYSTEM_NOT_JOB_WORKING_PEER_SEARCH_HONESTY_DESCRIPTION,
    actions: [],
  };
}

export type ResolveSystemNotJobWorkingNestedSearchUnboundInput = {
  readonly workingMode: boolean;
  readonly pathname: string | null | undefined;
  readonly pinnedArchitectureId?: string | null;
  readonly scopedRunId?: string | null;
};

/** True on nested architecture search when Working mode has no sealed review bound yet. */
export function resolveSystemNotJobWorkingNestedSearchShowsUnboundEmpty(
  input: ResolveSystemNotJobWorkingNestedSearchUnboundInput,
): boolean {
  if (!input.workingMode) {
    return false;
  }

  const pinnedArchitectureId = trimmedArchitectureId(input.pinnedArchitectureId);

  if (pinnedArchitectureId.length === 0) {
    return false;
  }

  const scopedRunId = input.scopedRunId?.trim() ?? "";

  return scopedRunId.length === 0;
}

export type ResolveSystemNotJobWorkingPeerSearchHonestyInput = {
  readonly workingMode: boolean;
  readonly pathname: string | null | undefined;
  readonly pinnedArchitectureId?: string | null;
};

/** True on bare peer search in Working mode — platform console honesty, not desk verb. */
export function resolveSystemNotJobWorkingPeerSearchShowsHonestyStrip(
  input: ResolveSystemNotJobWorkingPeerSearchHonestyInput,
): boolean {
  if (!input.workingMode) {
    return false;
  }

  const path = (input.pathname ?? "").split("?")[0] ?? "";

  if (path !== SEARCH_REVIEW_EVIDENCE_PATH) {
    return false;
  }

  const pinnedArchitectureId = trimmedArchitectureId(input.pinnedArchitectureId);

  return pinnedArchitectureId.length === 0;
}

/** Working peer search page subtitle — distinguishes workspace console from desk-bound nested search. */
export function resolveSystemNotJobWorkingPeerSearchPageSubtitle(guidedCopy: string): string {
  return `${guidedCopy} Working desk search lives on the architecture desk — this route is the cross-workspace evidence console when you need every review.`;
}
