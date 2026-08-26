/**
 * Customer-visible in-app documentation registry entries (buyer).
 * Source of truth: `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`.
 */
import { AUTHENTICATION_SIGN_IN_HELP_PAGE_TITLE } from "@/lib/authentication-sign-in-help-copy";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";
import type { ProductDocumentationRegistryInput } from "./product-documentation-registry-types";

export const PRODUCT_DOCUMENTATION_REGISTRY_ENTRIES_BUYER: readonly ProductDocumentationRegistryInput[] = [
  {
    "slug": "review-guide",
    "title": "Review guide",
    "summary": "Create an architecture review: name the review, upload evidence, add context, confirm scope, and finalize the review.",
    "audience": "buyer",
    "sourcePaths": [
      "docs/library/customer-facing/REVIEW_GUIDE.md"
    ],
    "lastReviewed": "2026-08-09",
    "pdfStatus": "public"
  },
  {
    "slug": "pilot-guide",
    "title": "Pilot guide",
    "summary": "Prepare for a pilot, run the first architecture review, interpret outputs, report issues, and get help. Includes workspace navigation and progressive Operate unlock guidance.",
    "audience": "buyer",
    "sourcePaths": [
      "docs/library/customer-facing/PILOT_GUIDE.md",
      "docs/library/customer-facing/WORKSPACE_NAVIGATION_GUIDE.md"
    ],
    "sectionAnchors": [
      "what-you-see",
      "main-workflow"
    ],
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "pilot preparation and first architecture review workflow",
    "pdfStatus": "public"
  },
  {
    "slug": "sponsor-report",
    "title": "Sponsor report",
    "summary": "Sponsor-safe summaries, ROI basis labels, and what executives should expect in exports.",
    "audience": "buyer",
    "sourcePaths": [
      "docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md",
      "docs/go-to-market/PILOT_SUCCESS_SCORECARD.md"
    ],
    "sectionAnchors": [
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
      "pilot-roi-measurement"
    ],
    "includeIntroWithSections": false,
    "pdfStatus": "public"
  },
  {
    "slug": "audit-trail",
    "title": "Audit trail",
    "summary": "Immutable audit events, correlation identifiers, and buyer-safe export posture.",
    "audience": "buyer",
    "sourcePaths": [
      "docs/library/AUDIT_EVENT_MODEL.md"
    ],
    "pdfStatus": "customer",
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "audit events and export posture"
  },
  {
    "slug": "authentication-sign-in",
    "title": "Authentication and sign-in",
    "summary": "Passwordless sign-in with work or school accounts or email one-time codes; invitations, SSO, and recovery.",
    "audience": "buyer",
    "sourcePaths": [
      "docs/library/customer-facing/AUTHENTICATION_AND_SIGN_IN.md"
    ],
    "pdfStatus": "public",
    "lastReviewed": "2026-08-04",
    "releaseApplicability": "Applies to hosted SaaS sign-in, invitations, and SSO-enforced tenants"
  },
  {
    "slug": "data-handling",
    "title": "Data handling and tenant isolation",
    "summary": "Data flow, tenant isolation, audit trail, and portability for architecture review evidence.",
    "audience": "buyer",
    "sourcePaths": [
      "docs/library/customer-facing/DATA_HANDLING.md"
    ],
    "pdfStatus": "public",
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "data flow and tenant isolation"
  },
  {
    "slug": "security-trust",
    "title": "Security and trust",
    "summary": "Assurance ladder, data handling, subprocessors, and diligence materials for procurement reviewers.",
    "audience": "buyer",
    "sourcePaths": [
      "docs/go-to-market/trust-center.md"
    ],
    "pdfStatus": "public",
    "lastReviewed": "2026-07-31"
  },
  {
    "slug": "soc2-self-assessment",
    "title": "SOC 2 self-assessment",
    "summary": "Internal readiness mapping aligned to SOC 2 Common Criteria — not a CPA attestation report.",
    "audience": "buyer",
    "sourcePaths": [
      "docs/security/SOC2_SELF_ASSESSMENT_2026.md"
    ],
    "pdfStatus": "public",
    "lastReviewed": "2026-05-26"
  },
  {
    "slug": "caiq-sig-response",
    "title": "CAIQ Lite / SIG Core questionnaire responses",
    "summary": "CAIQ Lite subset and SIG Core family summary index mapped to in-repo evidence — not a complete CAIQ or SIG submission.",
    "audience": "buyer",
    "sourcePaths": [
      "docs/security/CAIQ_LITE_2026.md",
      "docs/security/SIG_CORE_2026.md"
    ],
    "pdfStatus": "public"
  },
  {
    "slug": "subprocessors",
    "title": "Subprocessors",
    "summary": "Third-party subprocessors register for hosted ArchLucid.",
    "audience": "buyer",
    "sourcePaths": [
      "docs/go-to-market/SUBPROCESSORS.md"
    ],
    "pdfStatus": "public",
    "lastReviewed": "2026-07-25"
  },
  {
    "slug": "dpa-template",
    "title": "Data Processing Agreement (template)",
    "summary": "DPA template for contractual data-processing terms — requires legal review before execution.",
    "audience": "buyer",
    "sourcePaths": [
      "docs/go-to-market/DPA_TEMPLATE.md"
    ],
    "pdfStatus": "public"
  },
  {
    "slug": "procurement",
    "title": "Procurement FAQ",
    "summary": "Buyer-safe answers for InfoSec questionnaires, resilience reviews, and enterprise procurement.",
    "audience": "buyer",
    "sourcePaths": [
      "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"
    ],
    "sectionAnchors": [
      "enterprise-procurement-faq"
    ],
    "includeIntroWithSections": false
  },
  {
    "slug": "first-architecture-review",
    "title": "Your first architecture review",
    "summary": "Your guided path from evidence intake to a finalized architecture review and export-ready outputs.",
    "audience": "buyer",
    "sourcePaths": [
      "docs/CORE_PILOT.md"
    ],
    "pdfStatus": "public",
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "first architecture review workflow"
  },
  {
    "slug": "choose-your-next-step",
    "title": "Choose your next step",
    "summary": "Map your current goal — evaluate, pilot, procurement, sponsor output, or engineering support — to one primary next action.",
    "audience": "buyer",
    "sourcePaths": [
      "docs/go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md"
    ]
  }
] as const;
