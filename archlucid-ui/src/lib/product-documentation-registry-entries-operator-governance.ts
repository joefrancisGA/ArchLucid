/**
 * Customer-visible in-app documentation registry entries (operator).
 * Source of truth: `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`.
 */
import type { ProductDocumentationRegistryInput } from "./product-documentation-registry-types";

export const PRODUCT_DOCUMENTATION_REGISTRY_ENTRIES_OPERATOR_GOVERNANCE: readonly ProductDocumentationRegistryInput[] = [
  {
    "slug": "governance-approval",
    "title": "Resolve outcomes",
    "summary": "Learn how architecture work moves from submission to approval, revision, or rejection.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/GOVERNANCE_APPROVAL_OPERATOR_GUIDE.md",
    ],
    "pdfStatus": "customer",
  },
  {
    "slug": "policy-packs",
    "title": "Policy packs",
    "summary": "See which pack and rules apply to reviews, and how ArchLucid resolves conflicts when packs disagree.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/POLICY_PACKS_OPERATOR_GUIDE.md",
    ],
    "pdfStatus": "customer",
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "policy pack assignment and conflict resolution",
  },
  {
    "slug": "policy-pack-delta-demo",
    "title": "Policy-pack delta demo (internal runbook)",
    "summary": "Admin/SE demo script: same finalized architecture review, stricter pack enforcement, different finalize-gate outcome — dry-run, simulation, and audit slice. Not buyer self-serve help.",
    "audience": "operator",
    "sourcePaths": [
      "docs/go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md",
    ],
    "pdfStatus": null,
  },
  {
    "slug": "decision-register",
    "title": "Decision register",
    "summary": "Browse architecture decisions locked with finalized review records.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "decision register orientation",
  },
  {
    "slug": "sealed-record-vs-decision-register",
    "title": "Sealed review record vs decision register",
    "summary": "A sealed review record is the finalized package for one review; the decision register is the ledger of dispositions.",
    "audience": "operator",
    "sourcePaths": [],
    "lastReviewed": "2026-09-12",
    "releaseApplicability": "Desk-IA help (DI-023 / ADR 0095)",
  },
  {
    "slug": "standards-and-rules",
    "title": "Standards & rules",
    "summary": "Effective policy resolution rows, enforcement mode, and linked evidence for a review.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "Policy resolution, enforced rules, and diagnostic export",
  },
  {
    "slug": "governance-infrastructure-drift",
    "title": "Drift & snapshots",
    "summary": "Compare inventory snapshots, review semantic drift rows, and export advisory Terraform.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-09-09",
    "releaseApplicability": "infrastructure drift workbench orientation",
  },
  {
    "slug": "governance-infrastructure-resources",
    "title": "Resource explorer",
    "summary": "Browse cloud resources, apply filters, and open the evidence hub for one resource.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-10-16",
    "releaseApplicability": "infrastructure resource explorer and evidence hub orientation",
  },
  {
    "slug": "governance-infrastructure-terraform",
    "title": "Advisory Terraform mapping",
    "summary": "Review advisory Terraform addresses reconstructed from inventory snapshots before export.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-10-16",
    "releaseApplicability": "infrastructure Terraform mapping workbench orientation",
  },
  {
    "slug": "governance-infrastructure-diagrams",
    "title": "Inventory diagrams",
    "summary": "Render inventory diagrams from snapshots with partitioned fallbacks and PNG export.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-10-16",
    "releaseApplicability": "infrastructure diagrams workbench orientation",
  },
  {
    "slug": "governance-infrastructure-diagram-reconcile",
    "title": "Diagram reconciliation",
    "summary": "Reconcile ingested diagrams against inventory snapshots with explainable correspondence rows.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-10-16",
    "releaseApplicability": "infrastructure diagram reconciliation workbench orientation",
  },
  {
    "slug": "governance-infrastructure-ask",
    "title": "Infrastructure Ask",
    "summary": "Ask grounded questions about inventory evidence with citation-backed answers.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-10-16",
    "releaseApplicability": "infrastructure Ask workbench orientation",
  },
  {
    "slug": "governance-infrastructure-remediation",
    "title": "Remediation instances",
    "summary": "Track remediation instances and waves with advisory-only execute honesty.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-10-16",
    "releaseApplicability": "infrastructure remediation instances workbench orientation",
  },
  {
    "slug": "model-governance",
    "title": "AI and model policy",
    "summary": "Workspace execution profiles, approved model aliases, and profile mappings used on reviews.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "administration model approval orientation",
  },
  {
    "slug": "alerts",
    "title": "Alerts",
    "summary": "Learn how ArchLucid identifies policy and approval risks, routes them to the right owners, and tracks resolution.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "policy alerts orientation",
  },
  {
    "slug": "career-vs-rehearsal",
    "title": "Record vs Practice on the Working desk",
    "summary": "Choose Record for sealed-record evidence or Practice for labeled dry-runs — Simulator output is not sponsor proof.",
    "audience": "operator",
    "sourcePaths": [
      "docs/go-to-market/CAREER_VS_REHEARSAL_WORKING_DOORS.md",
    ],
    "lastReviewed": "2026-09-10",
    "releaseApplicability": "Working desk Career vs Rehearsal doors (AS-076+)",
  },
  {
    "slug": "security-evidence-paths",
    "title": "Security evidence paths",
    "summary": "Read architect path summaries, confidence bands, weakest hops, and cut points in Path inspect on remediation factory, SecureNow Findings, and Assigned to me.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/SECURITY_EVIDENCE_PATHS_OPERATOR_GUIDE.md",
    ],
    "lastReviewed": "2026-09-10",
    "releaseApplicability": "SecureNow remediation factory path inspect (SA-16/SA-21)",
    "pdfStatus": "customer",
  },
  {
    "slug": "architecture-sharing",
    "title": "Architecture sharing inside your tenant",
    "summary": "Optional restrict-to-shares hides a package from unshared workspace members — still one tenant, not chat or a second tenant.",
    "audience": "operator",
    "sourcePaths": [
      "docs/architecture/adrs/0087-architecture-share-acl-inside-tenant.md",
    ],
    "lastReviewed": "2026-09-10",
    "releaseApplicability": "Optional RestrictToShares inside tenant (AS-086+)",
  },
  {
    "slug": "pilot-feedback",
    "title": "Pilot feedback (internal runbook)",
    "summary": "Admin/product-owner guide for human judgment signals on findings and architecture reviews — separate from recommendation learning. Not default buyer help.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/PRODUCT_LEARNING.md",
    ],
  },
] as const;
