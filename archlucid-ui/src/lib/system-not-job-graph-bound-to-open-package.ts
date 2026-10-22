import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import {
  ARCHITECTURES_LIST_PATH,
  architectureNestedGraphPath,
} from "@/lib/architecture/architecture-routes";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_GRAPH_BOUND_TO_OPEN_PACKAGE_DOC_ANCHOR =
  "docs/architecture/adrs/0079-working-desk-is-the-work-surface.md" as const;

export const SYSTEM_NOT_JOB_GRAPH_BOUND_TO_OPEN_PACKAGE_OWNER = "SN-025" as const;

/** Query flag when unscoped Working Evidence graph sends the operator to the architecture portfolio. */
export const SYSTEM_NOT_JOB_WORKING_GRAPH_PORTFOLIO_BIND_QUERY_KEY = "deskBindGraph" as const;

/** SN-025 bind surfaces — peer redirect, desk tool href, nested graph mount, portfolio honesty. */
export const SYSTEM_NOT_JOB_WORKING_GRAPH_BIND_SURFACES: readonly string[] = [
  "archlucid-ui/src/lib/resolve-working-peer-graph-redirect-href.ts",
  "archlucid-ui/src/lib/resolve-working-desk-tool-href.ts",
  "archlucid-ui/src/components/insights/WorkingPeerGraphRedirect.tsx",
  "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/graph/ArchitectureNestedGraphPageClient.tsx",
  "archlucid-ui/src/app/(operator)/architecture/architectures/_sections/ArchitecturesHubWorkingGraphBindEmptyStrip.tsx",
  "archlucid-ui/src/components/insights/WorkingGraphPickArchitectureEmptyState.tsx",
  "archlucid-ui/src/app/(operator)/insights/evidence-graph/_sections/GraphPageCanvasShell.tsx",
];

export const SYSTEM_NOT_JOB_WORKING_GRAPH_PICK_ARCHITECTURE_TITLE =
  "Pick a system for the evidence graph" as const;

export const SYSTEM_NOT_JOB_WORKING_GRAPH_PICK_ARCHITECTURE_DESCRIPTION =
  "Evidence graph is bound to the architecture desk you have open — not a workspace-wide peer graph. Open an architecture below, then explore the graph on that desk after a sealed review exists." as const;

export type ResolveSystemNotJobWorkingPeerGraphRedirectHrefInput = {
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

function mergeSearchParams(search: string, extra: Record<string, string>): string {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  for (const [key, value] of Object.entries(extra)) {
    params.set(key, value);
  }

  const serialized = params.toString();

  return serialized.length > 0 ? `?${serialized}` : "";
}

/** SN-025 / ADR 0079 — portfolio landing when Working graph has no architecture context. */
export function resolveSystemNotJobWorkingGraphPortfolioHref(search?: string | null): string {
  const normalizedSearch = normalizeSearch(search);

  return `${ARCHITECTURES_LIST_PATH}${mergeSearchParams(normalizedSearch, {
    [SYSTEM_NOT_JOB_WORKING_GRAPH_PORTFOLIO_BIND_QUERY_KEY]: "1",
  })}`;
}

export function shouldShowSystemNotJobWorkingGraphPortfolioBindEmpty(search: string | null | undefined): boolean {
  const params = new URLSearchParams((search ?? "").replace(/^\?/, ""));

  return params.get(SYSTEM_NOT_JOB_WORKING_GRAPH_PORTFOLIO_BIND_QUERY_KEY) === "1";
}

export function buildSystemNotJobWorkingGraphPickArchitectureEmpty(): EnterpriseCompactEmptyStateProps {
  return {
    testId: "working-graph-pick-architecture-empty-state",
    title: SYSTEM_NOT_JOB_WORKING_GRAPH_PICK_ARCHITECTURE_TITLE,
    description: SYSTEM_NOT_JOB_WORKING_GRAPH_PICK_ARCHITECTURE_DESCRIPTION,
    actions: [
      {
        label: "Browse architectures",
        href: resolveSystemNotJobWorkingGraphPortfolioHref(),
        variant: "primary",
      },
    ],
  };
}

/**
 * SN-025 / ADR 0079 — Working peer Evidence graph redirects to nested graph when architecture is known.
 * Unscoped Working lands on the architecture portfolio with bind honesty (SY-41 body).
 * Returns null when no redirect applies (Guided or non-graph paths).
 */
export function resolveSystemNotJobWorkingPeerGraphRedirectHref(
  input: ResolveSystemNotJobWorkingPeerGraphRedirectHrefInput,
): string | null {
  const path = input.pathname.split("?")[0] ?? "";

  if (path !== EVIDENCE_GRAPH_PATH) {
    return null;
  }

  const architectureId = trimmedArchitectureId(input.lastOpenArchitectureId);

  if (architectureId.length === 0) {
    return resolveSystemNotJobWorkingGraphPortfolioHref(input.search);
  }

  const nestedBase = architectureNestedGraphPath(architectureId);
  const search = normalizeSearch(input.search);

  if (search.length === 0) {
    return nestedBase;
  }

  return `${nestedBase}${search}`;
}

export type ResolveSystemNotJobWorkingGraphUnscopedPeerInput = {
  readonly workingMode: boolean;
  readonly pathname: string | null | undefined;
  readonly pinnedArchitectureId?: string | null;
  readonly lastOpenArchitectureId?: string | null;
};

/** True on bare peer Evidence graph in Working mode when no architecture is bound yet. */
export function resolveSystemNotJobWorkingGraphShowsUnscopedPeerEmpty(
  input: ResolveSystemNotJobWorkingGraphUnscopedPeerInput,
): boolean {
  if (!input.workingMode) {
    return false;
  }

  const path = (input.pathname ?? "").split("?")[0] ?? "";

  if (path !== EVIDENCE_GRAPH_PATH) {
    return false;
  }

  const pinnedArchitectureId = trimmedArchitectureId(input.pinnedArchitectureId);
  const lastOpenArchitectureId = trimmedArchitectureId(input.lastOpenArchitectureId);

  return pinnedArchitectureId.length === 0 && lastOpenArchitectureId.length === 0;
}
