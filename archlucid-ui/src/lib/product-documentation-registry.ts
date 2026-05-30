/**
 * Customer-visible in-app documentation registry.
 * Source of truth: `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`.
 */
export type ProductDocumentationAudience = "operator" | "buyer" | "marketing" | "developer";

export type ProductDocumentationEntry = {
  slug: string;
  title: string;
  summary: string;
  audience: ProductDocumentationAudience;
  /** Repo-relative markdown path(s); first entry is primary body. */
  sourcePaths: readonly string[];
};

export const PRODUCT_DOCUMENTATION_REGISTRY: readonly ProductDocumentationEntry[] = [
  {
    slug: "first-pilot-path",
    title: "First-pilot operating path",
    summary:
      "Six-step operator path from setup verification through sponsor packet — what to do, when to defer Operate surfaces, and how to recover.",
    audience: "operator",
    sourcePaths: ["docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md"],
  },
  {
    slug: "pilot-guide",
    title: "Pilot guide",
    summary:
      "Create your first architecture review package, attach evidence, review findings, finalize the signed decision record, and export audit-ready evidence.",
    audience: "buyer",
    sourcePaths: ["docs/library/customer-facing/PILOT_GUIDE.md"],
  },
  {
    slug: "getting-started",
    title: "Getting started",
    summary: "Concepts, scope, and the fastest path to a governed review package.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CONCEPTS_IN_5_MINUTES.md", "docs/library/customer-facing/OPERATOR_QUICKSTART.md"],
  },
  {
    slug: "evidence-intake",
    title: "Evidence intake",
    summary: "How evidence enters the review package and what operators should verify before finalize.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md"],
  },
  {
    slug: "review-packages",
    title: "Review packages",
    summary: "Browse, inspect, and export governed review packages in the operator shell.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/OPERATOR_QUICKSTART.md"],
  },
  {
    slug: "executive-summary",
    title: "Executive summary",
    summary: "Sponsor-safe summaries, ROI basis labels, and what executives should expect in exports.",
    audience: "buyer",
    sourcePaths: ["docs/library/customer-facing/FAQ.md"],
  },
  {
    slug: "evidence-trail",
    title: "Evidence trail",
    summary: "Trace findings, artifacts, and provenance without exposing raw engineering logs.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CONCEPTS_IN_5_MINUTES.md"],
  },
  {
    slug: "governance-approval",
    title: "Governance approval",
    summary: "Submit, review, approve, and promote manifests when governance workflows are enabled.",
    audience: "operator",
    sourcePaths: [
      "docs/library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md",
      "docs/library/GOVERNANCE_WORKFLOW_UI.md",
    ],
  },
  {
    slug: "audit-trail",
    title: "Audit trail",
    summary: "Immutable audit events, correlation identifiers, and buyer-safe export posture.",
    audience: "buyer",
    sourcePaths: ["docs/library/customer-facing/FAQ.md", "docs/library/AUDIT_COVERAGE_MATRIX.md"],
  },
  {
    slug: "core-pilot",
    title: "Core Pilot",
    summary: "Operator walkthrough from first session through commit — checklist anchors and recovery links.",
    audience: "operator",
    sourcePaths: ["docs/CORE_PILOT.md"],
  },
  {
    slug: "first-value-20-minutes",
    title: "First value in 20 minutes",
    summary: "Time-boxed runbook for a first governed review package when platform wiring is already green.",
    audience: "operator",
    sourcePaths: ["docs/runbooks/FIRST_VALUE_20_MINUTES.md"],
  },
  {
    slug: "pilot-roi-model",
    title: "Pilot ROI model",
    summary: "How sponsor ROI figures are labeled, sourced, and kept buyer-safe in proof packets.",
    audience: "buyer",
    sourcePaths: ["docs/library/PILOT_ROI_MODEL.md"],
  },
  {
    slug: "cli-usage",
    title: "CLI usage",
    summary: "Non-interactive `archlucid` commands for proof packets, config lint, and support bundles.",
    audience: "developer",
    sourcePaths: ["docs/library/CLI_USAGE.md"],
  },
  {
    slug: "configuration-reference",
    title: "Configuration reference",
    summary: "ArchLucidAuth role mapping, hosting options, and production-like configuration keys.",
    audience: "developer",
    sourcePaths: ["docs/library/CONFIGURATION_REFERENCE.md"],
  },
  {
    slug: "specialty-walkthroughs",
    title: "Specialty walkthrough templates",
    summary: "Optional Azure SaaS, AI governance, and healthcare templates after first commit — not required for core pilot.",
    audience: "operator",
    sourcePaths: ["docs/library/walkthroughs/README.md"],
  },
  {
    slug: "operator-auth-roles",
    title: "Operator authentication and roles",
    summary: "JWT bearer role mapping, Entra app roles, and least-privilege role expectations.",
    audience: "developer",
    sourcePaths: ["docs/library/contributor-reference/SECURITY.md"],
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    summary: "First-line operator triage: health checks, correlation IDs, and support bundle collection.",
    audience: "operator",
    sourcePaths: ["docs/runbooks/TROUBLESHOOTING.md", "docs/runbooks/COMMON_ERRORS.md"],
  },
  {
    slug: "path-chooser",
    title: "Choose your next step",
    summary: "Map your current goal — evaluate, pilot, procurement, sponsor output, or engineering support — to one primary next action.",
    audience: "buyer",
    sourcePaths: ["docs/go-to-market/BUYER_OPERATOR_PATH_CHOOSER.md"],
  },
  {
    slug: "comparison-replay",
    title: "Compare and replay",
    summary: "Diff two reviews, replay stored comparison logic, and verify drift between runs.",
    audience: "operator",
    sourcePaths: ["docs/library/COMPARISON_REPLAY.md"],
  },
  {
    slug: "repeat-review-loop",
    title: "Repeat-review stickiness loop",
    summary:
      "After the first committed review: compare, replay, governance dry-runs, and second-review proof checklist.",
    audience: "operator",
    sourcePaths: ["docs/library/REPEAT_REVIEW_LOOP.md"],
  },
  {
    slug: "knowledge-graph",
    title: "Review trail graph",
    summary: "Visual review trail and provenance for one architecture review.",
    audience: "operator",
    sourcePaths: ["docs/library/KNOWLEDGE_GRAPH.md"],
  },
  {
    slug: "operator-shell",
    title: "Operator shell map",
    summary: "UI routes, API seams, and progressive Pilot vs Operate disclosure.",
    audience: "operator",
    sourcePaths: ["docs/library/operator-shell.md"],
  },
  {
    slug: "alerts",
    title: "Alerts",
    summary: "Inbox, rules, routing, composite alerts, and simulation tuning.",
    audience: "operator",
    sourcePaths: ["docs/library/ALERTS.md"],
  },
  {
    slug: "governance-api-contracts",
    title: "Governance and API contracts",
    summary: "Versioned HTTP behavior, auth, governance endpoints, and OpenAPI as contract of record.",
    audience: "developer",
    sourcePaths: ["docs/library/API_CONTRACTS.md"],
  },
  {
    slug: "observability",
    title: "Observability",
    summary: "Custom metrics, OTEL export paths, and health diagnostics.",
    audience: "operator",
    sourcePaths: ["docs/library/OBSERVABILITY.md"],
  },
  {
    slug: "projection-cache-replicas",
    title: "Projection cache and API replicas",
    summary: "When in-process graph caching is enough, when to enable Redis, and multi-replica footguns.",
    audience: "operator",
    sourcePaths: ["docs/operations/PROJECTION_CACHE_AND_REPLICAS.md"],
  },
  {
    slug: "glossary",
    title: "Glossary",
    summary: "Tenant, workspace, project scope headers and core product terms.",
    audience: "operator",
    sourcePaths: ["docs/library/GLOSSARY.md"],
  },
  {
    slug: "pilot-feedback",
    title: "Pilot feedback",
    summary: "Human judgments captured separately from recommendation learning.",
    audience: "operator",
    sourcePaths: ["docs/library/PRODUCT_LEARNING.md"],
  },
] as const;

const bySlug = new Map(PRODUCT_DOCUMENTATION_REGISTRY.map((entry) => [entry.slug, entry]));

export function getProductDocumentationEntry(slug: string): ProductDocumentationEntry | null {
  const normalized = slug.trim().toLowerCase();

  if (normalized.length === 0) {
    return null;
  }

  return bySlug.get(normalized) ?? null;
}

export function inAppHelpHref(slug: string, hashFragment?: string): string {
  const base = `/help/${slug.trim().toLowerCase()}`;
  const hash = hashFragment?.trim().replace(/^#/, "");

  if (hash === undefined || hash.length === 0) {
    return base;
  }

  return `${base}#${hash}`;
}

export function listProductDocumentationEntries(): readonly ProductDocumentationEntry[] {
  return PRODUCT_DOCUMENTATION_REGISTRY;
}
