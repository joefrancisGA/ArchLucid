/**
 * Customer-visible in-app documentation registry.
 * Source of truth: `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`.
 */
import { ACCELERATOR_CHOOSER_HELP_PAGE_TITLE } from "@/lib/accelerator-chooser-help-page-copy";
import { ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE } from "@/lib/admin-diagnostics-help-page-copy";
import { AUTHENTICATION_SIGN_IN_HELP_PAGE_TITLE } from "@/lib/authentication-sign-in-help-copy";
import { CUSTOMER_GLOSSARY_CONTRACT_VERSION } from "@/lib/customer-glossary-manifest";
import { ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE } from "@/lib/enterprise-onboarding-help-copy";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";
import { REVIEW_PACKAGES_HELP_PAGE_TITLE } from "@/lib/review-packages-help-page-copy";
import {
  resolveProductDocumentationContentKind,
  type ProductDocumentationContentKind,
} from "@/lib/product-documentation-content-kinds";
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
    title: "Ask memory from finalized reviews",
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
    pdfStatus: "public",
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
    title: REVIEW_PACKAGES_HELP_PAGE_TITLE,
    summary:
      "Find architecture packages in Reviews, inspect findings and evidence, and share export-ready artifacts.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/REVIEW_PACKAGES_OPERATOR_GUIDE.md"],
    lastReviewed: "2026-08-11",
    releaseApplicability: "architecture package browse, inspect, and export workflow",
    pdfStatus: "customer",
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
    slug: "sponsor-report",
    title: "Sponsor report",
    summary: "Sponsor-safe summaries, ROI basis labels, and what executives should expect in exports.",
    audience: "buyer",
    sourcePaths: [
      "docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md",
      "docs/go-to-market/PILOT_SUCCESS_SCORECARD.md",
    ],
    sectionAnchors: [
      "what-archlucid-is",
      "what-problem-it-solves",
      "core-value-pillars",
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
    title: AUTHENTICATION_SIGN_IN_HELP_PAGE_TITLE,
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
    lastReviewed: "2026-08-11",
    releaseApplicability:
      "Applies to in-product support intake, captured fields, and the redacted support bundle",
  },
  {
    slug: "contact-support",
    title: "Contact support",
    summary:
      "How to reach ArchLucid support — Report problem on error pages, email, troubleshooting, and redacted diagnostics bundles.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CONTACT_SUPPORT.md"],
    pdfStatus: "customer",
    lastReviewed: "2026-08-13",
    releaseApplicability: "Applies to in-product support discovery and escalation paths for all architect roles",
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
    lastReviewed: "2026-07-31",
  },
  {
    slug: "soc2-self-assessment",
    title: "SOC 2 self-assessment",
    summary: "Internal readiness mapping aligned to SOC 2 Common Criteria — not a CPA attestation report.",
    audience: "buyer",
    sourcePaths: ["docs/security/SOC2_SELF_ASSESSMENT_2026.md"],
    pdfStatus: "public",
    lastReviewed: "2026-05-26",
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
    lastReviewed: "2026-07-25",
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
      "Your guided path from evidence intake to a finalized architecture review and export-ready outputs.",
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
    title: ACCELERATOR_CHOOSER_HELP_PAGE_TITLE,
    summary:
      "Map buyer jobs to existing accelerator packs after your first finalized architecture review — inputs, outputs, and when not to use each pack.",
    audience: "operator",
    sourcePaths: ["docs/go-to-market/DEMO_QUICKSTART.md"],
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
    title: ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE,
    summary:
      "System health, workspace readiness, assistant diagnostics, and observability signals for platform health.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/OPERATOR_ADMIN_DIAGNOSTICS.md"],
    pdfStatus: "customer",
    lastReviewed: "2026-08-09",
    releaseApplicability: "platform health and workspace readiness signals",
  },
  {
    slug: "engineering-troubleshooting",
    title: "Engineering troubleshooting runbook",
    summary:
      "Admin-only specialty guide for CLI, environment, and log triage. Architects should use Troubleshooting; customers never deep-link here.",
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
      "Schedule summaries of review activity, governance signals, findings, and advisory scans for architects.",
    audience: "operator",
    // App-rendered specialty (`HelpDigestsGuideView`) — TB-2049.
    sourcePaths: [],
    lastReviewed: "2026-08-10",
    releaseApplicability: "architecture digests orientation",
  },
  {
    slug: "recurrence-schedules",
    title: "Recurrence schedules",
    summary: "Automate follow-up review cadences for architecture reviews.",
    audience: "operator",
    // App-rendered specialty (`HelpRecurrenceSchedulesGuideView`).
    sourcePaths: [],
    lastReviewed: "2026-08-12",
    releaseApplicability: "governance recurrence schedule orientation",
  },
  {
    slug: "decision-register",
    title: "Decision register",
    summary: "Browse architecture decisions locked with sealed review records.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "governance decision register orientation",
  },
  {
    slug: "improvement-planning",
    title: "Improvement planning",
    summary: "Convert review feedback into themes and prioritized improvement plans.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "insights improvement planning orientation",
  },
  {
    slug: "impact-preview",
    title: "Impact preview",
    summary: "Simulate before-and-after effects of proposed changes against a finalized baseline.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "insights impact preview orientation",
  },
  {
    slug: "advisory-scans",
    title: "Advisory scans",
    summary: "Generate prioritized follow-up recommendations from finalized reviews.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "governance advisory scans orientation",
  },
  {
    slug: "roi-summary",
    title: "ROI summary",
    summary: "Portfolio KPI framing for review-cycle reduction, effort saved, and governance-ready artifacts.",
    audience: "operator",
    // App-rendered specialty (`HelpRoiSummaryGuideView`).
    sourcePaths: [],
    lastReviewed: "2026-08-12",
    releaseApplicability: "sponsor ROI summary orientation",
  },
  {
    slug: "architecture-scorecard",
    title: "Architecture scorecard",
    summary: "Workspace throughput tiles and directional review-time savings for pilot discussions.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-12",
    releaseApplicability: "sponsor architecture scorecard orientation",
  },
  {
    slug: "connection-status",
    title: "Connection status",
    summary: "Workspace integration readiness tiles and connector follow-up surfaces.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-12",
    releaseApplicability: "administration connection status orientation",
  },
  {
    slug: "standards-and-rules",
    title: "Standards & rules",
    summary: "Effective policy resolution rows, enforcement mode, and linked evidence for a review.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "Governance policy resolution, enforced rules, and diagnostic export",
  },
  {
    slug: "baseline-settings",
    title: "Baseline settings",
    summary: "Workspace ROI measurement anchors for review-cycle hours, prep time, and people per review.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "administration baseline settings orientation",
  },
  {
    slug: "slack-integration",
    title: "Slack notifications",
    summary: "Configure Slack incoming webhook destinations for governance alert delivery.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "integrations slack notifications orientation",
  },
  {
    slug: "teams-integration",
    title: "Microsoft Teams notifications",
    summary: "Configure Microsoft Teams channel destinations for governance alert delivery.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "integrations teams notifications orientation",
  },
  {
    slug: "webhooks-integration",
    title: "Webhooks",
    summary: "Configure HTTPS webhook subscriptions for governance alert delivery.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "integrations webhooks orientation",
  },
  {
    slug: "api-keys",
    title: "API keys",
    summary: "Workspace automation credentials, rotation, and when in-product management is available.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "administration api keys orientation",
  },
  {
    slug: "system-health",
    title: "System health",
    summary: "Workspace operational readiness probes, dependencies, and deployment identity.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "administration system health orientation",
  },
  {
    slug: "ai-usage",
    title: "AI usage",
    summary: "Estimated AI spend, budget signals, and workflow cost filters for the workspace.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "Administration · AI usage orientation",
  },
  {
    slug: "preferences",
    title: "Preferences",
    summary: "Personal appearance settings saved to your signed-in account.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "Scope: personal account settings · Audience: all signed-in users",
  },
  {
    slug: "notifications",
    title: "Notifications",
    summary: "Channel launcher for digests, alerts, alert rules, Teams, and Slack — routes to where each destination configures.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "administration notifications orientation",
  },
  {
    slug: "workspace-settings",
    title: "Workspace settings",
    summary: "Tenant-wide defaults, quality gates, cost settings, and organization options.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "Administration · Workspace settings orientation",
  },
  {
    slug: "evidence-graph",
    title: "Evidence graph",
    summary: "How evidence connects to findings, decisions, approvals, and audit records for a finalized review.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "insights evidence graph orientation",
  },
  {
    slug: "search-review-evidence",
    title: "Search review evidence",
    summary: "How to search findings, decisions, and signed review evidence across the workspace index.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "insights search review evidence orientation",
  },
  {
    slug: "sponsor-dashboard",
    title: "Sponsor dashboard",
    summary: "Portfolio ROI trends, workspace-health KPI tiles, and sponsor exports for the selected scope.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "architecture sponsor dashboard orientation",
  },
  {
    slug: "architecture-intelligence",
    title: "Architecture intelligence",
    summary: "Closed-loop architecture reasoning, golden harness runs, and publish-to-findings orientation.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "architecture intelligence orientation",
  },
  {
    slug: "architecture-drafts",
    title: "Architecture drafts",
    summary: "Browse, resume, and refine saved architecture drafts before filing evidence for review.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "architecture drafts orientation",
  },
  {
    slug: "structured-brief",
    title: "Structured brief fields",
    summary:
      "How to fill constraints, assumptions, required capabilities, and quality attributes before evidence intake.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-20",
    releaseApplicability: "architecture draft structured brief orientation",
  },
  {
    slug: "model-governance",
    title: "AI and model governance",
    summary: "Workspace execution profiles, approved model aliases, and profile mappings used on reviews.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "administration model governance orientation",
  },
  {
    slug: "jira-integration",
    title: "Jira integration",
    summary: "Outbound Jira work-item routing, connection health, and workspace mapping settings.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "integrations jira orientation",
  },
  {
    slug: "servicenow-integration",
    title: "ServiceNow integration",
    summary: "Outbound ServiceNow incident routing, CMDB behavior, and connection health.",
    audience: "operator",
    sourcePaths: [],
    lastReviewed: "2026-08-13",
    releaseApplicability: "Integrations · ServiceNow orientation",
  },
  {
    slug: "alerts",
    title: "Alerts",
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
  const base = `/help/${preferredHelpPathSegmentForSlug(trimmed).trim().toLowerCase()}`;
  const hash = hashFragment?.trim().replace(/^#/, "");

  if (hash === undefined || hash.length === 0) {
    return base;
  }

  return `${base}#${hash}`;
}

export function listProductDocumentationEntries(): readonly ProductDocumentationEntry[] {
  return PRODUCT_DOCUMENTATION_REGISTRY;
}
