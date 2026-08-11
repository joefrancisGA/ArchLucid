/**
 * Customer-visible in-app documentation registry.
 * Source of truth: `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`.
 */
import { CUSTOMER_GLOSSARY_CONTRACT_VERSION } from "@/lib/customer-glossary-manifest";
import { ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE } from "@/lib/enterprise-onboarding-help-copy";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";
import {
  resolveProductDocumentationContentKind,
  type ProductDocumentationContentKind,
} from "@/lib/product-documentation-content-kinds";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help-topic-permanent-redirects";
import {
  cloudConnectionsHelpPathSegmentForRegistrySlug,
  normalizeCloudConnectionsSlashHelpTopicSlug,
} from "@/lib/cloud-connections-help-routes";

export type { ProductDocumentationContentKind } from "@/lib/product-documentation-content-kinds";
export type ProductDocumentationAudience = "operator" | "buyer" | "marketing" | "developer";

/** PDF pipeline eligibility — `null` means not PDF-eligible (TB-722). */
export type ProductDocumentationPdfStatus = "public" | "customer" | "internal";

export type ProductDocumentationEntry = {
  slug: string;
  title: string;
  summary: string;
  audience: ProductDocumentationAudience;
  /**
   * Repo-relative markdown path(s); first entry is primary body.
   * Empty means the topic is app-rendered (no markdown body) — e.g. glossary from `customer-glossary-manifest.ts`.
   */
  sourcePaths: readonly string[];
  /** When set, only these `{#anchor}` H2 sections (plus optional intro) are rendered. */
  sectionAnchors?: readonly string[];
  /** Include markdown before the first `##` when `sectionAnchors` is set. */
  includeIntroWithSections?: boolean;
  /** IA taxonomy kind for `/help` (TB-732); unused by rendering until later phases. */
  contentKind: ProductDocumentationContentKind;
  pdfStatus: ProductDocumentationPdfStatus | null;
  lastReviewed?: string;
  releaseApplicability?: string;
};

type ProductDocumentationRegistryInput = Omit<ProductDocumentationEntry, "pdfStatus" | "contentKind"> & {
  pdfStatus?: ProductDocumentationPdfStatus | null;
};

/** Slash `/help/cloud-connections/{provider}` URLs normalize to hyphen registry slugs (Batch K). */
export function normalizeHelpTopicSlug(slug: string): string {
  const trimmed = slug.trim().toLowerCase();

  if (trimmed.length === 0) {
    return trimmed;
  }

  const cloudRegistrySlug = normalizeCloudConnectionsSlashHelpTopicSlug(trimmed);

  if (cloudRegistrySlug !== null) {
    return cloudRegistrySlug;
  }

  return trimmed;
}

const PRODUCT_DOCUMENTATION_REGISTRY_INPUT: readonly ProductDocumentationRegistryInput[] = [
  {
    slug: "review-guide",
    title: "Review guide",
    summary:
      "Create an architecture review: name the review, upload evidence, add context, confirm scope, and finalize the review.",
    audience: "buyer",
    sourcePaths: ["docs/library/customer-facing/REVIEW_GUIDE.md"],
    lastReviewed: "2026-08-09",
    pdfStatus: "public",
  },
  {
    slug: "pilot-guide",
    title: "Pilot guide",
    summary:
      "Prepare for a pilot, run the first architecture review, interpret outputs, report issues, and get help. Includes workspace navigation and progressive Operate unlock guidance.",
    audience: "buyer",
    sourcePaths: [
      "docs/library/customer-facing/PILOT_GUIDE.md",
      "docs/library/customer-facing/WORKSPACE_NAVIGATION_GUIDE.md",
    ],
    sectionAnchors: ["what-you-see", "main-workflow"],
    lastReviewed: "2026-08-09",
    releaseApplicability: "pilot preparation and first architecture review workflow",
    pdfStatus: "public",
  },
  {
    slug: "prior-manifest-retrieval",
    title: "Prior manifest retrieval",
    summary:
      "How finalized architecture reviews become searchable tenant memory for Ask, what makes a useful prior, and when to avoid noisy reviews.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/PRIOR_MANIFEST_RETRIEVAL_GUIDE.md"],
  },
  {
    slug: "getting-started",
    title: "Getting started",
    summary:
      "Learn how ArchLucid turns architecture evidence into review findings, decisions, and governance-ready outputs.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CONCEPTS_IN_5_MINUTES.md"],
    lastReviewed: "2026-08-09",
    releaseApplicability: "product orientation and first review workflow",
    pdfStatus: "public",
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
    slug: "glossary",
    title: "Glossary",
    summary:
      "Definitions for the terms used throughout ArchLucid reviews, evidence, governance, and administration.",
    audience: "operator",
    // App-rendered from `customer-glossary-manifest.ts` — not a markdown help body.
    sourcePaths: [],
    lastReviewed: CUSTOMER_GLOSSARY_CONTRACT_VERSION,
    releaseApplicability: "product vocabulary for reviews, evidence, and governance",
  },
  {
    slug: "evidence-intake",
    title: "Start a review",
    summary:
      "Use this guide when you need accepted evidence formats, upload validation, and the right starting path on New architecture review.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/EVIDENCE_INTAKE_OPERATOR_GUIDE.md"],
    lastReviewed: "2026-08-10",
    releaseApplicability: "evidence intake and review starting paths",
    pdfStatus: "customer",
  },
  {
    slug: "review-packages",
    title: "Reviews",
    summary: "Browse, inspect, and export governed architecture reviews in the architect workspace.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/REVIEW_PACKAGES_OPERATOR_GUIDE.md"],
  },
  {
    slug: "findings",
    title: "Findings",
    summary:
      "Understand architecture risks, inspect supporting evidence, and decide how each finding should be addressed.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/FINDINGS_OPERATOR_GUIDE.md"],
  },
  {
    slug: "executive-summary",
    title: "Executive summary",
    summary: "Sponsor-safe summaries, ROI basis labels, and what executives should expect in exports.",
    audience: "buyer",
    sourcePaths: [
      "docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md",
      "docs/go-to-market/PILOT_SUCCESS_SCORECARD.md",
    ],
    sectionAnchors: [
      "what-pilot-proves",
      "measurable-pilot-value",
      "what-operate-adds",
      "what-expansion-would-look-like",
      "what-not-to-over-claim-yet",
      "sponsor-success-outcome",
      "limits-of-ai-explanations",
      "pilot-roi-measurement",
    ],
    includeIntroWithSections: false,
    pdfStatus: "public",
  },
  {
    slug: "evidence-trail",
    title: "Evidence graph",
    summary: "Trace findings, artifacts, and provenance without exposing raw engineering logs.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/EVIDENCE_TRAIL_OPERATOR_GUIDE.md"],
  },
  {
    slug: "governance-approval",
    title: "Governance approval",
    summary:
      "Learn how architecture work moves from submission to approval, revision, or rejection.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/GOVERNANCE_APPROVAL_OPERATOR_GUIDE.md"],
    pdfStatus: "customer",
  },
  {
    slug: "policy-packs",
    title: "Policy packs",
    summary:
      "See which pack and rules apply to reviews, and how ArchLucid resolves conflicts when packs disagree.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/POLICY_PACKS_OPERATOR_GUIDE.md"],
    pdfStatus: "customer",
    lastReviewed: "2026-08-09",
    releaseApplicability: "policy pack assignment and conflict resolution",
  },
  {
    slug: "policy-pack-delta-demo",
    title: "Policy-pack delta demo (internal runbook)",
    summary:
      "Admin/SE demo script: same finalized architecture review, stricter pack enforcement, different finalize-gate outcome — dry-run, simulation, and audit slice. Not buyer self-serve help.",
    audience: "operator",
    sourcePaths: ["docs/go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md"],
    pdfStatus: null,
  },
  {
    slug: "audit-trail",
    title: "Audit trail",
    summary: "Immutable audit events, correlation identifiers, and buyer-safe export posture.",
    audience: "buyer",
    sourcePaths: ["docs/library/AUDIT_EVENT_MODEL.md"],
    pdfStatus: "customer",
    lastReviewed: "2026-08-09",
    releaseApplicability: "audit events and export posture",
  },
  {
    slug: "authentication-sign-in",
    title: "Authentication and sign-in",
    summary:
      "Passwordless sign-in with work or school accounts or email one-time codes; invitations, SSO, and recovery.",
    audience: "buyer",
    sourcePaths: ["docs/library/customer-facing/AUTHENTICATION_AND_SIGN_IN.md"],
    pdfStatus: "public",
    lastReviewed: "2026-08-04",
    releaseApplicability: "Applies to hosted SaaS sign-in, invitations, and SSO-enforced tenants",
  },
  {
    slug: "report-a-problem",
    title: "Report a problem",
    summary:
      "Structured in-product support intake — captured fields, consent, optional bundle attach, and next-business-day response commitment.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/REPORT_A_PROBLEM.md"],
    pdfStatus: "customer",
  },
  {
    slug: "data-handling",
    title: "Data handling and tenant isolation",
    summary:
      "Data flow, tenant isolation, audit trail, and portability for architecture review evidence.",
    audience: "buyer",
    sourcePaths: ["docs/library/customer-facing/DATA_HANDLING.md"],
    pdfStatus: "public",
    lastReviewed: "2026-08-09",
    releaseApplicability: "data flow and tenant isolation",
  },
  {
    slug: "security-trust",
    title: "Security and trust",
    summary: "Assurance ladder, data handling, subprocessors, and diligence materials for procurement reviewers.",
    audience: "buyer",
    sourcePaths: ["docs/go-to-market/trust-center.md"],
    pdfStatus: "public",
  },
  {
    slug: "soc2-self-assessment",
    title: "SOC 2 self-assessment",
    summary: "Internal readiness mapping aligned to SOC 2 Common Criteria — not a CPA attestation report.",
    audience: "buyer",
    sourcePaths: ["docs/security/SOC2_SELF_ASSESSMENT_2026.md"],
    pdfStatus: "public",
  },
  {
    slug: "caiq-sig-response",
    title: "CAIQ Lite / SIG Core questionnaire responses",
    summary:
      "CAIQ Lite subset and SIG Core family summary index mapped to in-repo evidence — not a complete CAIQ or SIG submission.",
    audience: "buyer",
    sourcePaths: ["docs/security/CAIQ_LITE_2026.md", "docs/security/SIG_CORE_2026.md"],
    pdfStatus: "public",
  },
  {
    slug: "subprocessors",
    title: "Subprocessors",
    summary: "Third-party subprocessors register for hosted ArchLucid.",
    audience: "buyer",
    sourcePaths: ["docs/go-to-market/SUBPROCESSORS.md"],
    pdfStatus: "public",
  },
  {
    slug: "dpa-template",
    title: "Data Processing Agreement (template)",
    summary: "DPA template for contractual data-processing terms — requires legal review before execution.",
    audience: "buyer",
    sourcePaths: ["docs/go-to-market/DPA_TEMPLATE.md"],
    pdfStatus: "public",
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
    pdfStatus: "customer",
    lastReviewed: "2026-08-09",
    releaseApplicability: "optional cloud evidence connectors",
  },
  {
    slug: "cloud-connections-azure",
    title: "Connect Azure securely",
    summary:
      "Workload identity federation, read-only Azure roles, subscription scope, and connection validation — without long-lived secrets.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CLOUD_CONNECTIONS.md"],
    sectionAnchors: ["connect-azure-securely"],
    pdfStatus: "customer",
    lastReviewed: "2026-08-09",
    releaseApplicability: "optional cloud evidence connectors",
  },
  {
    slug: "cloud-connections-aws",
    title: "Connect AWS securely",
    summary:
      "OIDC-federated read-only IAM role, Resource Explorer inventory, and connection validation — without long-lived access keys.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CLOUD_CONNECTIONS.md"],
    sectionAnchors: ["connect-aws-securely"],
    pdfStatus: "customer",
    lastReviewed: "2026-08-09",
    releaseApplicability: "optional cloud evidence connectors",
  },
  {
    slug: "cloud-connections-gcp",
    title: "Connect GCP securely",
    summary:
      "Workload Identity Federation, Cloud Asset Viewer, project scope, and connection validation — without service-account JSON keys.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CLOUD_CONNECTIONS.md"],
    sectionAnchors: ["connect-gcp-securely"],
    pdfStatus: "customer",
    lastReviewed: "2026-08-09",
    releaseApplicability: "optional cloud evidence connectors (GCP Workload Identity Federation connector)",
  },
  {
    slug: "azure-permissions",
    title: "Azure permissions for cloud connections",
    summary:
      "Grant ArchLucid the minimum read-only Azure roles, scopes, and verification steps for hosted cloud connections.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/AZURE_CLOUD_CONNECTION_PERMISSIONS.md"],
    pdfStatus: "customer",
    lastReviewed: "2026-08-09",
    releaseApplicability: "optional cloud evidence connectors",
  },
  {
    slug: "enterprise-onboarding",
    title: ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE,
    summary:
      "Checklist for configuring a hosted ArchLucid enterprise tenant: SSO, roles, governance, policy packs, audit export, and optional Azure cloud evidence.",
    audience: "operator",
    sourcePaths: ["docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md"],
    pdfStatus: "customer",
    lastReviewed: "2026-08-09",
    releaseApplicability: "hosted enterprise tenant onboarding checklist",
  },
  {
    slug: "integration-readiness",
    title: "Integration readiness",
    summary:
      "Understand ready, recommended, and optional notification, ticketing, publishing, and delivery integrations for your workspace.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/INTEGRATION_READINESS.md"],
  },
  {
    slug: "azure-boards",
    title: "Azure Boards integration",
    summary:
      "Connect Azure DevOps for work item creation from ArchLucid findings — independent of your architecture cloud provider.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/AZURE_BOARDS_INTEGRATION.md"],
    pdfStatus: "public",
    lastReviewed: "2026-08-09",
    releaseApplicability: "Azure Boards work item connector",
  },
  {
    slug: "procurement",
    title: "Procurement FAQ",
    summary: "Buyer-safe answers for InfoSec questionnaires, resilience reviews, and enterprise procurement.",
    audience: "buyer",
    sourcePaths: ["docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"],
    // TB-1254: FAQ section only — packet intro is SE/ops contributor material.
    sectionAnchors: ["enterprise-procurement-faq"],
    includeIntroWithSections: false,
  },
  {
    slug: "billing-and-plans",
    title: "Billing and plans",
    summary:
      "How ArchLucid billing works — manage subscriptions, payment methods, seats, and usage from Billing and plans.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/BILLING_AND_PLANS.md"],
    lastReviewed: "2026-08-09",
    releaseApplicability: "workspace billing and subscriptions",
  },
  {
    slug: "first-architecture-review",
    title: FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE,
    summary:
      "Your guided path from evidence intake to a finalized architecture review and sponsor-ready exports.",
    audience: "buyer",
    sourcePaths: ["docs/CORE_PILOT.md"],
    pdfStatus: "public",
    lastReviewed: "2026-08-09",
    releaseApplicability: "first architecture review workflow",
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
    summary:
      "Admin task guide for identity/SSO, API keys, and production-like hosting posture, with a collapsed key-catalog appendix. Admin-gated internal runbook.",
    audience: "developer",
    sourcePaths: ["docs/library/CONFIGURATION_REFERENCE.md"],
  },
  {
    slug: "accelerator-chooser",
    title: "Pick an accelerator pack",
    summary:
      "Map buyer jobs to existing accelerator packs after your first finalized architecture review — inputs, outputs, and when not to use each pack.",
    audience: "operator",
    sourcePaths: [],
    sectionAnchors: ["accelerator-chooser"],
    pdfStatus: null,
  },
  {
    slug: "specialty-walkthroughs",
    title: "Specialty review templates",
    summary:
      "Start with focused guidance for a specific architecture, governance, or industry scenario.",
    audience: "operator",
    sourcePaths: ["docs/library/walkthroughs/README.md"],
  },
  {
    slug: "users-and-roles",
    title: "Users and roles",
    summary:
      "Understand ArchLucid roles, who can manage access, and how permissions apply across your workspace.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/USERS_AND_ROLES_GUIDE.md"],
    pdfStatus: "customer",
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    summary:
      "Find common issues, try the first fix, and collect support details when needed.",
    audience: "operator",
    // App-rendered from `troubleshooting-help-guide-content.ts` — not a markdown help body.
    sourcePaths: [],
  },
  {
    slug: "admin-diagnostics",
    title: "Admin diagnostics",
    summary:
      "System health, workspace readiness, assistant diagnostics, and observability signals for platform health.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/OPERATOR_ADMIN_DIAGNOSTICS.md"],
    pdfStatus: "customer",
    lastReviewed: "2026-08-09",
    releaseApplicability: "platform health and workspace readiness signals",
  },
  {
    slug: "developer-troubleshooting",
    title: "Engineering troubleshooting runbook",
    summary:
      "Admin-only specialty guide for CLI, environment, and log triage. Operators should use Troubleshooting; customers never deep-link here.",
    audience: "developer",
    sourcePaths: ["docs/runbooks/TROUBLESHOOTING.md", "docs/runbooks/COMMON_ERRORS.md"],
    lastReviewed: "2026-08-09",
    releaseApplicability: "engineering support and platform triage",
  },
  {
    slug: "choose-your-next-step",
    title: "Choose your next step",
    summary: "Map your current goal — evaluate, pilot, procurement, sponsor output, or engineering support — to one primary next action.",
    audience: "buyer",
    sourcePaths: ["docs/go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md"],
  },
  {
    slug: "comparison-replay",
    title: "Compare and replay",
    summary: "Diff two architecture reviews, replay a saved comparison, and verify drift without re-running a full review.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/COMPARISON_REPLAY_OPERATOR_GUIDE.md"],
    lastReviewed: "2026-08-09",
    releaseApplicability: "Compare two reviews and Validate review workspace tools",
  },
  {
    slug: "repeat-review-loop",
    title: "Your repeat architecture review",
    summary:
      "After the first finalized architecture review: compare, replay, governance dry-runs, and second-review proof checklist.",
    audience: "operator",
    sourcePaths: ["docs/library/REPEAT_REVIEW_LOOP.md"],
    lastReviewed: "2026-07-27",
  },
  {
    slug: "digests",
    title: "Architecture digests",
    summary:
      "Schedule summaries of review activity, governance signals, findings, and advisory scans for operators.",
    audience: "operator",
    // App-rendered specialty (`HelpDigestsGuideView`) — TB-2049.
    sourcePaths: [],
    lastReviewed: "2026-08-10",
    releaseApplicability: "architecture digests orientation",
  },
  {
    slug: "alerts",
    title: "Understanding governance alerts",
    summary:
      "Learn how ArchLucid identifies governance risks, routes them to the right owners, and tracks resolution.",
    audience: "operator",
    // App-rendered specialty (`HelpAlertsGuideView`) — copy owned in `alerts-help-guide-content.ts`.
    sourcePaths: [],
    lastReviewed: "2026-08-09",
    releaseApplicability: "governance alerts orientation",
  },
  {
    slug: "api-contracts",
    title: "API contracts (technical reference)",
    summary:
      "Admin/developer HTTP contract reference — versioned endpoint behavior, auth, and OpenAPI as contract of record. Not buyer governance-approval help.",
    audience: "developer",
    sourcePaths: ["docs/library/API_CONTRACTS.md"],
    lastReviewed: "2026-08-10",
    releaseApplicability: "HTTP contract of record for integrators",
  },
  {
    slug: "pilot-feedback",
    title: "Pilot feedback (internal runbook)",
    summary:
      "Admin/product-owner guide for human judgment signals on findings and architecture reviews — separate from recommendation learning. Not default buyer help.",
    audience: "operator",
    sourcePaths: ["docs/library/PRODUCT_LEARNING.md"],
  },
] as const;

export const PRODUCT_DOCUMENTATION_REGISTRY: readonly ProductDocumentationEntry[] =
  PRODUCT_DOCUMENTATION_REGISTRY_INPUT.map((entry) => ({
    ...entry,
    contentKind: resolveProductDocumentationContentKind(entry.slug),
    pdfStatus: entry.pdfStatus ?? null,
  }));

const bySlug = new Map(PRODUCT_DOCUMENTATION_REGISTRY.map((entry) => [entry.slug, entry]));

export function getProductDocumentationEntry(slug: string): ProductDocumentationEntry | null {
  const normalized = normalizeHelpTopicSlug(slug);

  if (normalized.length === 0) {
    return null;
  }

  return bySlug.get(normalized) ?? null;
}

/** Prefer slash canonicals for cloud-connection provider help topics. */
function preferredHelpPathSegmentForSlug(slug: string): string {
  const normalized = normalizeHelpTopicSlug(slug);
  const slashSegment = cloudConnectionsHelpPathSegmentForRegistrySlug(normalized);

  if (slashSegment !== null) {
    return slashSegment;
  }

  return normalized;
}

export function inAppHelpHref(slug: string, hashFragment?: string): string {
  const trimmed = slug.trim().toLowerCase();
  const permanentRedirect = resolveHelpTopicPermanentRedirect(trimmed);
  const base =
    permanentRedirect ?? `/help/${preferredHelpPathSegmentForSlug(trimmed).trim().toLowerCase()}`;
  const hash = hashFragment?.trim().replace(/^#/, "");

  if (hash === undefined || hash.length === 0) {
    return base;
  }

  return `${base}#${hash}`;
}

export function listProductDocumentationEntries(): readonly ProductDocumentationEntry[] {
  return PRODUCT_DOCUMENTATION_REGISTRY;
}
