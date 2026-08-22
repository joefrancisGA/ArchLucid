import { tryResolveInAppDocHref, resolveInAppDocHref } from "@/lib/in-app-doc-href";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";
import { isInternalRunbookSlug } from "@/lib/product-documentation-content-kinds";
import { PERSONA_SHELL_WORKSPACE_UI_MAP_LABEL } from "@/lib/vocabulary/persona-shell-vocabulary";

function documentationSearchItemResolvesToInternalRunbook(relativeDocsPath: string): boolean {
  const href = tryResolveInAppDocHref(relativeDocsPath);

  if (href === null) {
    return false;
  }

  const slug = href.replace(/^\/help\/?/, "").split("#")[0] ?? "";

  if (slug.length === 0) {
    return false;
  }

  return isInternalRunbookSlug(slug);
}

export type DocumentationSearchItem = {
  title: string;
  description: string;
  category: string;
  /** Relative repo path beginning with `docs/…` for {@link resolveInAppDocHref}. */
  relativeDocsPath: string;
};

/**
 * Curated operator-facing docs for Ctrl+K search. Paths match the repository layout on `main`.
 * TB-1385 / TB-1247 / TB-2237: Admin-only internal-runbook topics are omitted from {@link DOCUMENTATION_SEARCH_ITEMS}.
 */
const CURATED_DOCUMENTATION_SEARCH_ITEMS: readonly DocumentationSearchItem[] = [
  {
    category: "Guides",
    title: FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE,
    description: "Guided path from evidence intake to a finalized architecture review and export-ready outputs.",
    relativeDocsPath: "docs/CORE_PILOT.md",
  },
  {
    category: "Pilot",
    title: "Operator quickstart (commands)",
    description: "Command-first operator entry for familiar automation.",
    relativeDocsPath: "docs/library/customer-facing/OPERATOR_QUICKSTART.md",
  },
  {
    category: "Pilot",
    title: "Troubleshooting",
    description: "Find common issues, try the first fix, and collect support details when needed.",
    relativeDocsPath: "docs/library/customer-facing/operator_troubleshooting.md",
  },
  {
    category: "Operations",
    title: "CLI usage",
    description: "archlucid commands, config, support bundle, doctor.",
    relativeDocsPath: "docs/library/CLI_USAGE.md",
  },
  {
    category: "Operations",
    title: "API contracts",
    description: "Versioned HTTP behavior, auth, and OpenAPI as contract of record.",
    relativeDocsPath: "docs/library/API_CONTRACTS.md",
  },
  {
    category: "Operations",
    title: "Release smoke",
    description: "Scripted smoke scope and CI parity notes.",
    relativeDocsPath: "docs/library/RELEASE_SMOKE.md",
  },
  {
    category: "Operations",
    title: "Configuration reference",
    description: "ConfigurationKey catalog narrative.",
    relativeDocsPath: "docs/library/CONFIGURATION_REFERENCE.md",
  },
  {
    category: "Security",
    title: "Security model",
    description: "Auth modes, RBAC, SCIM, and operational security posture.",
    relativeDocsPath: "docs/library/contributor-reference/SECURITY.md",
  },
  {
    category: "Security",
    title: "Trust center",
    description: "Buyer index for assurance, subprocessors, and policies.",
    relativeDocsPath: "docs/go-to-market/trust-center.md",
  },
  {
    category: "Governance",
    title: "Audit coverage matrix",
    description: "Maps operations to durable audit events.",
    relativeDocsPath: "docs/library/AUDIT_COVERAGE_MATRIX.md",
  },
  {
    category: "Governance",
    title: "Approval check before finalize",
    description: "Blocks review finalize when severity thresholds breach.",
    relativeDocsPath: "docs/library/PRE_COMMIT_GOVERNANCE_GATE.md",
  },
  {
    category: "Integrations",
    title: "Connector readiness matrix",
    description: "First-party vs recipe integrations and tests.",
    relativeDocsPath: "docs/library/CONNECTOR_READINESS_MATRIX.md",
  },
  {
    category: "Scope",
    title: "Product scope contract",
    description: "In-scope and deferred product boundaries.",
    relativeDocsPath: "docs/library/V1_SCOPE.md",
  },
  {
    category: "Architecture",
    title: "Architecture on one page",
    description: "System context and containers poster.",
    relativeDocsPath: "docs/ARCHITECTURE_ON_ONE_PAGE.md",
  },
  {
    category: "Architecture",
    title: "Architecture flows",
    description: "Review lifecycle, exports, compare/replay narratives.",
    relativeDocsPath: "docs/library/ARCHITECTURE_FLOWS.md",
  },
  {
    category: "Analysis",
    title: "Comparison and replay",
    description: "Two-review compare, replay modes, export records.",
    relativeDocsPath: "docs/library/COMPARISON_REPLAY.md",
  },
  {
    category: "Analysis",
    title: "Knowledge graph",
    description: "Provenance and architecture graph for one review.",
    relativeDocsPath: "docs/library/KNOWLEDGE_GRAPH.md",
  },
  {
    category: "Operations",
    title: "Observability",
    description: "Custom metrics, OTEL export paths, dashboards.",
    relativeDocsPath: "docs/library/OBSERVABILITY.md",
  },
  {
    category: "Operations",
    title: PERSONA_SHELL_WORKSPACE_UI_MAP_LABEL,
    description: "UI routes, API seams, and progressive disclosure.",
    relativeDocsPath: "docs/library/operator-shell.md",
  },
  {
    category: "Operations",
    title: "Live E2E happy path",
    description: "Playwright SQL-backed gate narrative.",
    relativeDocsPath: "docs/library/LIVE_E2E_HAPPY_PATH.md",
  },
  {
    category: "Product",
    title: "Product packaging",
    description: "Pilot vs Operate layers and capability inventory.",
    relativeDocsPath: "docs/library/PRODUCT_PACKAGING.md",
  },
  {
    category: "Product",
    title: "Finding engine output reference",
    description: "Built-in engine inventory and example outputs.",
    relativeDocsPath: "docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md",
  },
  {
    category: "Go-to-market",
    title: "Competitive comparison (matrix)",
    description: "Honest positioning vs manual review and tooling categories.",
    relativeDocsPath: "docs/go-to-market/COMPETITIVE_COMPARISON.md",
  },
  {
    category: "Demo",
    title: "Demo recording storyboard",
    description: "Scripted 3-minute capture for buyers.",
    relativeDocsPath: "docs/demo/DEMO_RECORDING_STORYBOARD.md",
  },
  {
    category: "Start here",
    title: "START_HERE",
    description: "Single canonical buyer/operator entry.",
    relativeDocsPath: "docs/START_HERE.md",
  },
];

export const DOCUMENTATION_SEARCH_ITEMS: readonly DocumentationSearchItem[] =
  CURATED_DOCUMENTATION_SEARCH_ITEMS.filter(
    (row) => !documentationSearchItemResolvesToInternalRunbook(row.relativeDocsPath),
  );

/** Resolves a relative docs path to the in-app help URL without navigating. */
export function resolveDocumentationHref(relativeDocsPath: string): string {
  return resolveInAppDocHref(relativeDocsPath);
}
