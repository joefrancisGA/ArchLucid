import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import {
  ARCHITECTURES_LIST_PATH,
  architectureNestedAskPath,
} from "@/lib/architecture/architecture-routes";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_ASK_BOUND_TO_OPEN_PACKAGE_DOC_ANCHOR =
  "docs/architecture/adrs/0079-working-desk-is-the-work-surface.md" as const;

export const SYSTEM_NOT_JOB_ASK_BOUND_TO_OPEN_PACKAGE_OWNER = "SN-024" as const;

/** Query flag when unscoped Working Ask sends the operator to the architecture portfolio. */
export const SYSTEM_NOT_JOB_WORKING_ASK_PORTFOLIO_BIND_QUERY_KEY = "deskBindAsk" as const;

/** SN-024 bind surfaces — peer redirect, desk tool href, nested Ask mount, portfolio honesty. */
export const SYSTEM_NOT_JOB_WORKING_ASK_BIND_SURFACES: readonly string[] = [
  "archlucid-ui/src/lib/resolve-working-peer-ask-redirect-href.ts",
  "archlucid-ui/src/lib/resolve-working-desk-tool-href.ts",
  "archlucid-ui/src/components/insights/WorkingPeerAskRedirect.tsx",
  "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/ask/ArchitectureNestedAskPageClient.tsx",
  "archlucid-ui/src/app/(operator)/architecture/architectures/_sections/ArchitecturesHubWorkingAskBindEmptyStrip.tsx",
  "archlucid-ui/src/components/insights/WorkingAskPickArchitectureEmptyState.tsx",
];

export const SYSTEM_NOT_JOB_WORKING_ASK_PICK_ARCHITECTURE_TITLE =
  "Pick a system to ask" as const;

export const SYSTEM_NOT_JOB_WORKING_ASK_PICK_ARCHITECTURE_DESCRIPTION =
  "Ask is bound to the architecture desk you have open — not a workspace-wide Career Q&A surface. Open an architecture below, then use Ask on that desk after a sealed review exists." as const;

export type ResolveSystemNotJobWorkingPeerAskRedirectHrefInput = {
  readonly pathname: string;
  readonly search?: string | null;
  readonly lastOpenArchitectureId?: string | null;
  readonly queryArchitectureId?: string | null;
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

function mergeSearchParams(search: string, extra: Record<string, string>): string {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  for (const [key, value] of Object.entries(extra)) {
    params.set(key, value);
  }

  const serialized = params.toString();

  return serialized.length > 0 ? `?${serialized}` : "";
}

/** SN-024 / ADR 0079 — portfolio landing when Working Ask has no architecture context. */
export function resolveSystemNotJobWorkingAskPortfolioHref(search?: string | null): string {
  const normalizedSearch = normalizeSearch(search);

  return `${ARCHITECTURES_LIST_PATH}${mergeSearchParams(normalizedSearch, {
    [SYSTEM_NOT_JOB_WORKING_ASK_PORTFOLIO_BIND_QUERY_KEY]: "1",
  })}`;
}

export function shouldShowSystemNotJobWorkingAskPortfolioBindEmpty(search: string | null | undefined): boolean {
  const params = new URLSearchParams((search ?? "").replace(/^\?/, ""));

  return params.get(SYSTEM_NOT_JOB_WORKING_ASK_PORTFOLIO_BIND_QUERY_KEY) === "1";
}

export function buildSystemNotJobWorkingAskPickArchitectureEmpty(): EnterpriseCompactEmptyStateProps {
  return {
    testId: "working-ask-pick-architecture-empty-state",
    title: SYSTEM_NOT_JOB_WORKING_ASK_PICK_ARCHITECTURE_TITLE,
    description: SYSTEM_NOT_JOB_WORKING_ASK_PICK_ARCHITECTURE_DESCRIPTION,
    actions: [
      {
        label: "Browse architectures",
        href: resolveSystemNotJobWorkingAskPortfolioHref(),
        variant: "primary",
      },
    ],
  };
}

/**
 * SN-024 / ADR 0079 — Working peer Ask redirects to nested Ask when architecture is known.
 * Unscoped Working lands on the architecture portfolio with bind honesty (SY-37 body).
 * Returns null when no redirect applies (Guided or non-Ask paths).
 */
export function resolveSystemNotJobWorkingPeerAskRedirectHref(
  input: ResolveSystemNotJobWorkingPeerAskRedirectHrefInput,
): string | null {
  const path = input.pathname.split("?")[0] ?? "";

  if (path !== ASK_REVIEW_QUESTIONS_PATH) {
    return null;
  }

  const architectureId =
    trimmedArchitectureId(input.queryArchitectureId) ||
    trimmedArchitectureId(input.lastOpenArchitectureId);

  if (architectureId.length === 0) {
    return resolveSystemNotJobWorkingAskPortfolioHref(input.search);
  }

  const nestedBase = architectureNestedAskPath(architectureId);
  const search = normalizeSearch(input.search);

  if (search.length === 0) {
    return nestedBase;
  }

  return `${nestedBase}${search}`;
}

export type ResolveSystemNotJobWorkingAskUnscopedPeerInput = {
  readonly workingMode: boolean;
  readonly pathname: string | null | undefined;
  readonly pinnedArchitectureId?: string | null;
  readonly lastOpenArchitectureId?: string | null;
};

/** True on bare peer Ask in Working mode when no architecture is bound yet. */
export function resolveSystemNotJobWorkingAskShowsUnscopedPeerEmpty(
  input: ResolveSystemNotJobWorkingAskUnscopedPeerInput,
): boolean {
  if (!input.workingMode) {
    return false;
  }

  const path = (input.pathname ?? "").split("?")[0] ?? "";

  if (path !== ASK_REVIEW_QUESTIONS_PATH) {
    return false;
  }

  const pinnedArchitectureId = trimmedArchitectureId(input.pinnedArchitectureId);
  const lastOpenArchitectureId = trimmedArchitectureId(input.lastOpenArchitectureId);

  return pinnedArchitectureId.length === 0 && lastOpenArchitectureId.length === 0;
}
