/**
 * Customer-visible in-app documentation registry entries (operator).
 * Source of truth: `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`.
 */
import type { ProductDocumentationRegistryInput } from "./product-documentation-registry-types";

export const PRODUCT_DOCUMENTATION_REGISTRY_ENTRIES_OPERATOR_WORKSPACE: readonly ProductDocumentationRegistryInput[] = [
  {
    "slug": "prior-manifest-retrieval",
    "title": "Ask memory from finalized reviews",
    "summary": "How finalized architecture reviews become searchable tenant memory for Ask, what makes a useful prior, and when to avoid noisy reviews.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/PRIOR_MANIFEST_RETRIEVAL_GUIDE.md",
    ],
  },
  {
    "slug": "getting-started",
    "title": "Getting started",
    "summary": "Learn how ArchLucid turns architecture evidence into review findings, decisions, and export-ready outputs.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/CONCEPTS_IN_5_MINUTES.md",
    ],
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "product orientation and architecture desk workflow",
    "pdfStatus": "public",
  },
  {
    "slug": "scope",
    "title": "Workspace and scope guide",
    "summary": "Understand tenant, workspace, and project scope, including how the header switcher and sample workspace work.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/WORKSPACE_SCOPE_GUIDE.md",
    ],
    "pdfStatus": "public",
  },
  {
    "slug": "glossary",
    "title": "Glossary",
    "summary": "Definitions for the terms used throughout ArchLucid reviews, evidence, approval, and administration.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-07-13",
    "releaseApplicability": "product vocabulary for reviews, evidence, and approval",
  },
  {
    "slug": "evidence-intake",
    "title": "Start a review",
    "summary": "Use this guide when you need accepted evidence formats, upload validation, and the right starting path on New architecture review.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/EVIDENCE_INTAKE_OPERATOR_GUIDE.md",
    ],
    "lastReviewed": "2026-08-10",
    "releaseApplicability": "evidence intake and review starting paths",
    "pdfStatus": "customer",
  },
  {
    "slug": "review-packages",
    "title": "Architecture packages",
    "summary": "Find architecture packages in Reviews, inspect findings and evidence, and share export-ready artifacts.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/REVIEW_PACKAGES_OPERATOR_GUIDE.md",
    ],
    "lastReviewed": "2026-08-11",
    "releaseApplicability": "architecture package browse, inspect, and export workflow",
    "pdfStatus": "customer",
  },
  {
    "slug": "findings",
    "title": "Findings",
    "summary": "Understand architecture risks, inspect supporting evidence, and decide how each finding should be addressed.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/FINDINGS_OPERATOR_GUIDE.md",
    ],
  },
  {
    "slug": "evidence-trail",
    "title": "Evidence graph",
    "summary": "Trace findings, artifacts, and provenance without exposing raw engineering logs.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/EVIDENCE_TRAIL_OPERATOR_GUIDE.md",
    ],
  },
  {
    "slug": "report-a-problem",
    "title": "Report a problem",
    "summary": "Structured in-product support intake — captured fields, consent, optional bundle attach, and next-business-day response commitment.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/REPORT_A_PROBLEM.md",
    ],
    "pdfStatus": "customer",
    "lastReviewed": "2026-08-11",
    "releaseApplicability": "Applies to in-product support intake, captured fields, and the redacted support bundle",
  },
  {
    "slug": "contact-support",
    "title": "Contact support",
    "summary": "How to reach ArchLucid support — Report problem on error pages, email, troubleshooting, and redacted diagnostics bundles.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/CONTACT_SUPPORT.md",
    ],
    "pdfStatus": "customer",
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "Applies to in-product support discovery and escalation paths for all architect roles",
  },
  {
    "slug": "enterprise-onboarding",
    "title": "Hosted SaaS enterprise onboarding checklist",
    "summary": "Checklist for configuring a hosted ArchLucid enterprise tenant: SSO, roles, approval workflows, policy packs, audit export, and optional Azure cloud evidence.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md",
    ],
    "pdfStatus": "customer",
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "hosted enterprise tenant onboarding checklist",
  },
  {
    "slug": "billing-and-plans",
    "title": "Billing and plans",
    "summary": "How ArchLucid billing works — manage subscriptions, payment methods, seats, and usage from Billing and plans.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/BILLING_AND_PLANS.md",
    ],
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "workspace billing and subscriptions",
  },
  {
    "slug": "accelerator-chooser",
    "title": "Starter packs",
    "summary": "Map buyer jobs to existing accelerator packs after your first finalized architecture review — inputs, outputs, and when not to use each pack.",
    "audience": "operator",
    "sourcePaths": [
      "docs/go-to-market/DEMO_QUICKSTART.md",
    ],
    "sectionAnchors": [
      "accelerator-chooser",
    ],
    "pdfStatus": null,
  },
  {
    "slug": "specialty-walkthroughs",
    "title": "Specialty review templates",
    "summary": "Start with focused guidance for a specific architecture, approval, or industry scenario.",
    "audience": "operator",
    "lastReviewed": "2026-05-01",
    "sourcePaths": [
      "docs/library/walkthroughs/README.md",
    ],
  },
  {
    "slug": "users-and-roles",
    "title": "Users and roles",
    "summary": "Understand ArchLucid roles, who can manage access, and how permissions apply across your workspace.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/USERS_AND_ROLES_GUIDE.md",
    ],
    "pdfStatus": "customer",
  },
  {
    "slug": "troubleshooting",
    "title": "Troubleshooting",
    "summary": "Find common issues, try the first fix, and collect support details when needed.",
    "audience": "operator",
    "sourcePaths": [
    ],
  },
  {
    "slug": "admin-diagnostics",
    "title": "Platform health",
    "summary": "System health, workspace readiness, assistant diagnostics, and observability signals for platform health.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/OPERATOR_ADMIN_DIAGNOSTICS.md",
    ],
    "pdfStatus": "customer",
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "platform health and workspace readiness signals",
  },
  {
    "slug": "comparison-replay",
    "title": "Compare and replay",
    "summary": "Diff two architecture reviews, replay a saved comparison, and verify drift without re-running a full review.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/COMPARISON_REPLAY_OPERATOR_GUIDE.md",
    ],
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "Compare two reviews and Validate review workspace tools",
  },
  {
    "slug": "repeat-review-loop",
    "title": "Your repeat architecture review",
    "summary": "After the first finalized architecture review: compare, replay, policy dry-runs, and second-review proof checklist.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/REPEAT_REVIEW_LOOP.md",
    ],
    "lastReviewed": "2026-07-27",
  },
  {
    "slug": "digests",
    "title": "Architecture digests",
    "summary": "Schedule summaries of review activity, approval signals, findings, and advisory scans for architects.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-10",
    "releaseApplicability": "architecture digests orientation",
  },
  {
    "slug": "recurrence-schedules",
    "title": "Recurrence schedules",
    "summary": "Automate follow-up review cadences for architecture reviews.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-12",
    "releaseApplicability": "recurrence schedule orientation",
  },
  {
    "slug": "improvement-planning",
    "title": "Improvement planning",
    "summary": "Convert review feedback into themes and prioritized improvement plans.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "insights improvement planning orientation",
  },
  {
    "slug": "impact-preview",
    "title": "Impact preview",
    "summary": "Simulate before-and-after effects of proposed changes against a finalized baseline.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "insights impact preview orientation",
  },
  {
    "slug": "advisory-scans",
    "title": "Advisory scans",
    "summary": "Generate prioritized follow-up recommendations from finalized reviews.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "advisory scans orientation",
  },
  {
    "slug": "roi-summary",
    "title": "ROI summary",
    "summary": "Portfolio KPI framing for review-cycle reduction, effort saved, and export-ready artifacts.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-12",
    "releaseApplicability": "sponsor ROI summary orientation",
  },
  {
    "slug": "architecture-scorecard",
    "title": "Architecture scorecard",
    "summary": "Workspace throughput tiles and directional review-time savings for pilot discussions.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-12",
    "releaseApplicability": "sponsor architecture scorecard orientation",
  },
  {
    "slug": "baseline-settings",
    "title": "Baseline settings",
    "summary": "Workspace ROI measurement anchors for review-cycle hours, prep time, and people per review.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "administration baseline settings orientation",
  },
  {
    "slug": "api-keys",
    "title": "API keys",
    "summary": "Workspace automation credentials, rotation, and when in-product management is available.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "administration api keys orientation",
  },
  {
    "slug": "system-health",
    "title": "System health",
    "summary": "Workspace operational readiness probes, dependencies, and deployment identity.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "administration system health orientation",
  },
  {
    "slug": "ai-usage",
    "title": "AI usage",
    "summary": "Estimated AI spend, budget signals, and workflow cost filters for the workspace.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "Administration · AI usage orientation",
  },
  {
    "slug": "preferences",
    "title": "Preferences",
    "summary": "Personal appearance and theme settings.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "Scope: personal account settings · Audience: all signed-in users",
  },
  {
    "slug": "notifications",
    "title": "Notifications",
    "summary": "Channel launcher for digests, alerts, alert rules, Teams, and Slack — routes to where each destination configures.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "administration notifications orientation",
  },
  {
    "slug": "workspace-settings",
    "title": "Workspace settings",
    "summary": "Tenant-wide defaults, quality gates, cost settings, and organization options.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "Administration · Workspace settings orientation",
  },
  {
    "slug": "evidence-graph",
    "title": "Evidence graph",
    "summary": "How evidence connects to findings, decisions, approvals, and audit records for a finalized review.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "insights evidence graph orientation",
  },
  {
    "slug": "search-review-evidence",
    "title": "Search review evidence",
    "summary": "How to search findings, decisions, and finalized review evidence across the workspace index.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "insights search review evidence orientation",
  },
  {
    "slug": "sponsor-dashboard",
    "title": "Sponsor dashboard",
    "summary": "Portfolio ROI trends, workspace-health KPI tiles, and sponsor exports for the selected scope.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "architecture sponsor dashboard orientation",
  },
  {
    "slug": "architecture-intelligence",
    "title": "Architecture intelligence",
    "summary": "Closed-loop architecture reasoning, golden harness runs, and publish-to-findings orientation.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "architecture intelligence orientation",
  },
  {
    "slug": "architecture-drafts",
    "title": "Architecture drafts",
    "summary": "Browse, resume, and refine saved architecture drafts before filing evidence for review.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "architecture drafts orientation",
  },
  {
    "slug": "structured-brief",
    "title": "Structured brief fields",
    "summary": "How to fill constraints, assumptions, required capabilities, and quality attributes before evidence intake.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-20",
    "releaseApplicability": "architecture draft structured brief orientation",
  },
] as const;
