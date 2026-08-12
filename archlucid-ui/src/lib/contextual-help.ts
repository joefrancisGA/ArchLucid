import { getDocHref } from "@/lib/help-topics";
import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import { GOVERNANCE_ALERTS_PATH, GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

/**
 * Operator pages → repo-root-relative doc path (optional #fragment for GitHub heading navigation).
 * Keys follow primary route segments (`/runs` is the conceptual list; the UI path is `/architecture/reviews`).
 */
const PAGE_KEY_TO_DOC_REF: Readonly<Record<string, string>> = {
  "/runs": "docs/library/customer-facing/OPERATOR_QUICKSTART.md#operator-ui",
  [REVIEWS_LIST_PATH]: "docs/library/customer-facing/OPERATOR_QUICKSTART.md#operator-ui",
  "/runs/[id]": "docs/library/customer-facing/WORKSPACE_NAVIGATION_GUIDE.md#main-workflow",
  "/insights/compare-two-reviews": "docs/library/COMPARISON_REPLAY.md",
  "/governance/approval-queue": "docs/library/PRE_COMMIT_GOVERNANCE_GATE.md",
  [GOVERNANCE_AUDIT_PATH]: "docs/library/AUDIT_COVERAGE_MATRIX.md",
  [GOVERNANCE_ALERTS_PATH]: "docs/library/ALERTS.md",
  "/insights/evidence-graph": "docs/library/KNOWLEDGE_GRAPH.md",
};

/** Page keys with a documentation mapping (for tests and drift checks). */
export const CONTEXTUAL_HELP_PAGE_KEYS = Object.freeze(Object.keys(PAGE_KEY_TO_DOC_REF));

function splitDocRef(docRef: string): { path: string; fragment: string | null } {
  const hash = docRef.indexOf("#");

  if (hash < 0) {
    return { path: docRef, fragment: null };
  }

  return {
    path: docRef.slice(0, hash),
    fragment: docRef.slice(hash + 1),
  };
}

/**
 * Resolves contextual documentation URL for an operator page key (in-app `/help` routes via {@link getDocHref}).
 */
export function getHelpUrl(pageKey: string): string | null {
  const docRef = PAGE_KEY_TO_DOC_REF[pageKey];

  if (docRef == null || docRef.trim().length === 0) {
    return null;
  }

  const { path, fragment } = splitDocRef(docRef);
  const trimmedPath = path.trim();

  if (trimmedPath.length === 0) {
    return null;
  }

  const base = getDocHref(trimmedPath);

  if (base == null) {
    return null;
  }

  if (fragment != null && fragment.length > 0) {
    return `${base}#${fragment}`;
  }

  return base;
}

/** Distinct repo-relative markdown paths (no fragments) used by {@link getHelpUrl}. */
export function listContextualHelpDocPaths(): readonly string[] {
  const paths = new Set<string>();

  for (const docRef of Object.values(PAGE_KEY_TO_DOC_REF)) {
    const { path } = splitDocRef(docRef);

    if (path.trim().length > 0) {
      paths.add(path.trim());
    }
  }

  return Object.freeze([...paths].sort((a, b) => a.localeCompare(b)));
}
