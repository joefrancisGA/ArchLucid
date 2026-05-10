import { getDocHref } from "@/lib/help-topics";

/**
 * Operator pages → repo-root-relative doc path (optional #fragment for GitHub heading navigation).
 * Keys follow primary route segments (`/runs` is the conceptual list; the UI path is `/reviews`).
 */
const PAGE_KEY_TO_DOC_REF: Readonly<Record<string, string>> = {
  "/runs": "docs/library/OPERATOR_QUICKSTART.md#operator-ui",
  "/runs/[id]": "docs/library/operator-shell.md#main-workflow",
  "/compare": "docs/library/COMPARISON_REPLAY.md",
  "/governance": "docs/library/PRE_COMMIT_GOVERNANCE_GATE.md",
  "/audit": "docs/library/AUDIT_COVERAGE_MATRIX.md",
  "/alerts": "docs/library/ALERTS.md",
  "/graph": "docs/library/KNOWLEDGE_GRAPH.md",
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
 * Resolves contextual documentation URL for an operator page key.
 * Base URL: `NEXT_PUBLIC_DOCS_BASE_URL`, or public GitHub `main` blob base when unset (see {@link getDocHref}).
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
