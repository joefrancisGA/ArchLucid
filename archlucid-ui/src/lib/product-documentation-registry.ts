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
  /** When set, only these `{#anchor}` H2 sections (plus optional intro) are rendered. */
  sectionAnchors?: readonly string[];
  /** Include markdown before the first `##` when `sectionAnchors` is set. */
  includeIntroWithSections?: boolean;
};

/** Slug aliases for contextual deep links (`/help/{slug}`). */
export const HELP_TOPIC_SLUG_ALIASES: Readonly<Record<string, string>> = {
  "cloud-connections/azure": "cloud-connections-azure",
  "cloud-connections/aws": "cloud-connections-aws",
  "cloud-connections/gcp": "cloud-connections-gcp",
  "security/workload-identity-federation": "workload-identity-federation",
  "security/azure-permissions": "azure-permissions",
  "users-and-roles": "operator-auth-roles",
};

export function normalizeHelpTopicSlug(slug: string): string {
  const trimmed = slug.trim().toLowerCase();

  if (trimmed.length === 0) {
    return trimmed;
  }

  return HELP_TOPIC_SLUG_ALIASES[trimmed] ?? trimmed;
}

export const PRODUCT_DOCUMENTATION_REGISTRY: readonly ProductDocumentationEntry[] = [
  {
    slug: "first-review",
    title: "First review in 90 minutes",
    summary:
      "Printable first-run evidence checklist — demo or new request through finalize, extractor ZIP upload, ROI proof, and audit export.",
    audience: "operator",
    sourcePaths: ["docs/runbooks/FIRST_RUN_EVIDENCE_CHECKLIST.md"],
  },
  {
    slug: "pre-commit-ci-gate",
    title: "Pre-commit gate in CI",
    summary:
      "Copy-paste GitHub Actions and Azure DevOps starters that call pre-commit simulate or commit on a tagged review using API key secrets.",
    audience: "developer",
    sourcePaths: ["docs/runbooks/PRE_COMMIT_CI_GATE_STARTER.md"],
  },
  {
    slug: "pilot-nav-profile",
    title: "Workspace navigation profile",
    summary:
      "How the sidebar keeps the first-review path focused until your first review is committed — and how to unlock analysis and governance on demand.",
    audience: "operator",
    sourcePaths: ["docs/library/operator-shell.md"],
    sectionAnchors: ["what-you-see", "main-workflow"],
  },
  {
    slug: "first-hour-operator-path",
    title: "First-review guide",
    summary:
      "Complete one review package before opening deeper governance, reporting, or integration workflows.",
    audience: "buyer",
    sourcePaths: ["docs/library/FIRST_HOUR_OPERATOR_PATH.md"],
  },
  {
    slug: "review-guide",
    title: "Review guide",
    summary:
      "Create an architecture review: name the review, upload evidence, add context, confirm scope, and finalize the review package.",
    audience: "buyer",
    sourcePaths: ["docs/library/customer-facing/REVIEW_GUIDE.md"],
  },
  {
    slug: "first-pilot-path",
    title: "Complete review workflow",
    summary:
      "End-to-end review lifecycle — create a package, attach evidence, review findings, finalize, and export sponsor-ready artifacts.",
    audience: "buyer",
    sourcePaths: ["docs/library/customer-facing/COMPLETE_REVIEW_WORKFLOW.md"],
  },
  {
    slug: "first-pilot-operator-runbook",
    title: "First-pilot workspace runbook",
    summary:
      "Internal phase checklist — platform readiness, evidence ingest, proof collection, and pilot recovery for platform and release owners.",
    audience: "developer",
    sourcePaths: ["docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md"],
  },
  {
    slug: "pilot-guide",
    title: "Pilot guide",
    summary:
      "Prepare for a pilot, run the first architecture review, interpret outputs, report issues, and get help.",
    audience: "buyer",
    sourcePaths: ["docs/library/customer-facing/PILOT_GUIDE.md"],
  },
  {
    slug: "getting-started",
    title: "Getting started",
    summary:
      "Learn how ArchLucid turns architecture evidence into review findings, decisions, and governance-ready outputs.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CONCEPTS_IN_5_MINUTES.md"],
  },
  {
    slug: "scope",
    title: "Workspace and scope guide",
    summary:
      "Understand tenant, workspace, and project scope, including how the header switcher and sample workspace work.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/WORKSPACE_SCOPE_GUIDE.md"],
  },
  {
    slug: "evidence-intake",
    title: "Start a review",
    summary: "Start a review from a brief, diagram, document, or cloud evidence; verify intake before finalize.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md"],
  },
  {
    slug: "review-packages",
    title: "Review packages",
    summary: "Browse, inspect, and export governed review packages in the architect workspace.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md"],
  },
  {
    slug: "findings",
    title: "Findings",
    summary: "Severity, business impact, evidence citations, and recommended monitoring or remediation actions.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md"],
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
    title: "Governance workflow",
    summary: "Submit, review, approve, and promote signed review records when governance workflows are enabled.",
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
    slug: "how-it-works",
    title: "How ArchLucid works",
    summary:
      "From architecture evidence to findings, decisions, governance records, and sponsor-ready outputs.",
    audience: "buyer",
    sourcePaths: ["docs/library/customer-facing/HOW_ARCHLUCID_WORKS.md"],
  },
  {
    slug: "data-handling",
    title: "What ArchLucid does with your data",
    summary:
      "Data flow, tenant isolation, audit trail, and portability for architecture review evidence.",
    audience: "buyer",
    sourcePaths: ["docs/library/customer-facing/DATA_HANDLING.md"],
  },
  {
    slug: "security-trust",
    title: "Security and trust",
    summary: "Assurance ladder, data handling, subprocessors, and diligence materials for procurement reviewers.",
    audience: "buyer",
    sourcePaths: ["docs/go-to-market/trust-center.md", "docs/library/customer-facing/DATA_HANDLING.md"],
  },
  {
    slug: "cloud-connections",
    title: "Cloud connections",
    summary:
      "Optional Azure, AWS, and GCP connections for read-only evidence — or evidence-only reviews without any connector.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CLOUD_CONNECTIONS.md"],
    sectionAnchors: ["choose-your-cloud-platform", "related-topics"],
    includeIntroWithSections: true,
  },
  {
    slug: "cloud-connections-azure",
    title: "Connect Azure securely",
    summary:
      "Workload identity federation, read-only Azure roles, subscription scope, and connection validation — without long-lived secrets.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CLOUD_CONNECTIONS.md"],
    sectionAnchors: ["connect-azure-securely"],
  },
  {
    slug: "cloud-connections-aws",
    title: "Connect AWS securely",
    summary:
      "OIDC-federated read-only IAM role, Resource Explorer inventory, and connection validation — without long-lived access keys.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CLOUD_CONNECTIONS.md"],
    sectionAnchors: ["connect-aws-securely"],
  },
  {
    slug: "cloud-connections-gcp",
    title: "Connect GCP securely",
    summary:
      "Workload Identity Federation, Cloud Asset Viewer, project scope, and connection validation — without service-account JSON keys.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CLOUD_CONNECTIONS.md"],
    sectionAnchors: ["connect-gcp-securely"],
  },
  {
    slug: "workload-identity-federation",
    title: "Workload identity federation",
    summary: "How ArchLucid-hosted Azure ingestion authenticates without storing client secrets.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CLOUD_CONNECTIONS.md"],
    sectionAnchors: ["workload-identity-federation"],
  },
  {
    slug: "azure-permissions",
    title: "Azure permissions for cloud connections",
    summary: "Reader and Cost Management Reader scope — what ArchLucid requires and what to avoid.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CLOUD_CONNECTIONS.md"],
    sectionAnchors: ["azure-permissions"],
  },
  {
    slug: "enterprise-onboarding",
    title: "Enterprise onboarding checklist",
    summary:
      "Checklist for configuring a hosted ArchLucid enterprise tenant: SSO, roles, governance, policy packs, audit export, and optional Azure cloud evidence.",
    audience: "buyer",
    sourcePaths: ["docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md"],
  },
  {
    slug: "procurement",
    title: "Procurement FAQ",
    summary: "Buyer-safe answers for InfoSec questionnaires, resilience reviews, and enterprise procurement.",
    audience: "buyer",
    sourcePaths: ["docs/go-to-market/PROCUREMENT_FAQ.md"],
  },
  {
    slug: "billing-and-plans",
    title: "Billing and plans",
    summary: "Team, Professional, and Enterprise packaging — plans, limits, and upgrade paths.",
    audience: "operator",
    sourcePaths: ["docs/library/PRODUCT_PACKAGING.md"],
  },
  {
    slug: "core-pilot",
    title: "Your first architecture review",
    summary:
      "Guided first-review checklist — evidence, optional cloud connectors, finalize, and sponsor exports.",
    audience: "buyer",
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
    slug: "evaluator-workbook",
    title: "Evaluator workbook",
    summary: "Compact evaluator orientation — prerequisites, session flow, and pass/hold rules before deep configuration.",
    audience: "buyer",
    sourcePaths: ["docs/onboarding/EVALUATOR_WORKBOOK.md"],
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
    slug: "accelerator-chooser",
    title: "Accelerator chooser",
    summary:
      "Map buyer jobs to existing starter proof packs after Core Pilot first commit — inputs, outputs, and V1 scope labels.",
    audience: "operator",
    sourcePaths: ["docs/library/ACCELERATOR_CHOOSER.md"],
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
    title: "Users and roles",
    summary: "JWT bearer role mapping, Entra app roles, and least-privilege role expectations for tenant admins.",
    audience: "developer",
    sourcePaths: ["docs/library/contributor-reference/SECURITY.md"],
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    summary:
      "If something fails: refresh, check session and workspace, download a support bundle, then contact your tenant admin or ArchLucid support.",
    audience: "operator",
    sourcePaths: [
      "docs/library/customer-facing/OPERATOR_TROUBLESHOOTING.md",
    ],
  },
  {
    slug: "admin-diagnostics",
    title: "Admin diagnostics",
    summary:
      "System status, workspace readiness, assistant diagnostics, and observability signals for platform health.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/OPERATOR_ADMIN_DIAGNOSTICS.md"],
  },
  {
    slug: "developer-troubleshooting",
    title: "Engineering troubleshooting runbook",
    summary:
      "CLI commands, environment variables, log patterns, and deep failure signatures for engineering support.",
    audience: "developer",
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
    slug: "policy-pack-delta-demo",
    title: "Policy-pack delta demo",
    summary:
      "Repeatable demo: same committed review, stricter pack enforcement, different pre-commit gate outcome — dry-run, simulation, and audit slice.",
    audience: "operator",
    sourcePaths: ["docs/go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md"],
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
    title: "Architect workspace map",
    summary: "UI routes, review workflows, and what can wait until later for first review vs advanced surfaces.",
    audience: "operator",
    sourcePaths: ["docs/library/operator-shell.md"],
    sectionAnchors: [
      "what-it-is",
      "what-you-see",
      "main-workflow",
      "trial-banner",
      "keyboard-and-accessibility",
      "empty-loading-and-error-states",
      "audit-log",
      "artifact-review",
      "evidence-graph-vs-compare-vs-replay",
    ],
  },
  {
    slug: "alerts",
    title: "Alerts",
    summary: "Triage governance alerts and configure alert rules, routing, and simulation.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/ALERTS_OPERATOR_GUIDE.md"],
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
    slug: "privacy-policy",
    title: "Privacy policy",
    summary: "How ArchLucid collects, uses, and protects personal information — GDPR and CCPA coverage.",
    audience: "buyer",
    sourcePaths: ["docs/go-to-market/PRIVACY_POLICY.md"],
  },
  {
    slug: "example-roi-bulletin",
    title: "Example aggregate ROI bulletin (synthetic)",
    summary:
      "Illustrative aggregate baseline bulletin shape for procurement — not production data; real publication gates on admin preview with minTenants.",
    audience: "marketing",
    sourcePaths: ["docs/go-to-market/SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md"],
  },
  {
    slug: "resilience-exercises",
    title: "Resilience exercise log",
    summary: "Staging fault-injection exercise summaries and operational resilience practices.",
    audience: "buyer",
    sourcePaths: ["docs/quality/game-day-log/README.md"],
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
  const normalized = normalizeHelpTopicSlug(slug);

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
