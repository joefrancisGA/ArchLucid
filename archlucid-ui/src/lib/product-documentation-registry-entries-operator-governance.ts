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
    "slug": "pilot-feedback",
    "title": "Pilot feedback (internal runbook)",
    "summary": "Admin/product-owner guide for human judgment signals on findings and architecture reviews — separate from recommendation learning. Not default buyer help.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/PRODUCT_LEARNING.md",
    ],
  },
] as const;
