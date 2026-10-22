/** Homepage marketing copy — aligned to service-led GTM (pain → outcome → report). */

import { DEMO_WORKSPACE_B_RUN_ID } from "@/lib/demo-workspace-scope";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import { SEE_IT_PAGE_TITLE } from "@/lib/see-it-page-copy";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";

/** TB-1294: metadata title beyond bare “Welcome”. */
export const WELCOME_PAGE_METADATA_TITLE = "ArchLucid · Defensible architecture, on demand";

/**
 * TB-1295 owner choice: hero primary conversion = self-demo inspect (Workspace A sample).
 * Signup, walkthrough, and early access stay reachable below the fold.
 */
export const WELCOME_PRIMARY_CONVERSION_PATH = "self-demo" as const;

/** TB-1294: one supporting sentence above the fold — detail lives in problem/solution. */
export const WELCOME_HERO_PITCH_OPERATOR =
  "Turn scattered architecture evidence into a prioritized, evidence-linked review your ARB can defend — exportable proof in days, not weeks.";

export const WELCOME_HERO_PITCH_BUYER =
  "Turn scattered architecture evidence into an architecture review your ARB can defend — explore sample proof first.";

/** Marketing welcome hero pitch — shorter buyer-oriented line above the fold. */
export const WELCOME_HERO_PITCH = WELCOME_HERO_PITCH_BUYER;

export const WELCOME_PRIMARY_CONTENT_ID = "welcome-primary-content" as const;

/**
 * Differentiators answering "why this and not a chat assistant".
 * Rendered below the hero band (TB-1294) in problem/solution — not in the first-viewport CTA stack.
 * Each line must name shipped behavior already evidenced elsewhere on the page (pillars, Trust Center);
 * never add outcome claims here that the sample review cannot demonstrate.
 */
export const WELCOME_HERO_DIFFERENTIATORS: readonly string[] = [
  "Every finding traces to evidence",
  "Finalized review records with an audit trail",
  "Policy packs included",
  "Exports for ARB, audit, and procurement",
];

export const WELCOME_HERO_CTA_SUBHEADING =
  "See a policy-backed architecture review — not slide decks alone.";

/**
 * Architect-led reassurance shown under the hero subheading: leads with self-serve inspection and
 * names the two non-negotiable trust properties (evidence traceability, audit trail). No claim here
 * exceeds shipped behavior — keep aligned with the Trust Center and `/security-trust`.
 *
 * TERMINOLOGY RULE (do not "fix" back to "review"): "evaluation" here means the BUYER's activity of
 * evaluating ArchLucid on entry CTAs (signup / try / hero). This is intentionally allowed and is NOT
 * the banned product-status adjective use ("evaluation value report", "evaluation standards" → "review",
 * shipped under TB-456/457/458, COPY_TERMINOLOGY_AUDIT §2). Never write "evaluation workspace"; never use
 * "evaluation" to describe the product's maturity or a product surface. The curated showcase/demo package
 * is the "sample review" — the dominant shipped term across 15+ surfaces (SampleReviewPackageSummary,
 * FrictionlessTrialLauncher, /see-it, /demo/preview); "example review" exists only as a synonym in the
 * TB-473/474 renamed badges, so keep marketing copy on "sample review" for consistency.
 */
export const WELCOME_HERO_EVALUATION_REASSURANCE =
  "Inspect a sample review built on fabricated data, then bring your own architecture evidence when ready. No sales call required.";

/** TB-1298 / TB-1280: honest see-it framing — no bare “30 seconds” / “30s”. */
export const WELCOME_SEE_IT_CTA_LABEL = SEE_IT_PAGE_TITLE;

export const WELCOME_SEE_IT_HREF = "/see-it" as const;

/**
 * TB-1296 Option A (M-107): Claims-static primary anonymous proof; Contoso / longer walkthrough secondary.
 * Ladder: see-it → Claims showcase → guided walkthrough → Contoso ROI (labeled).
 */
export const WELCOME_PROOF_LADDER_PRIMARY_HREF = WELCOME_SEE_IT_HREF;

export const WELCOME_PROOF_LADDER_SAMPLE_HREF = CANONICAL_ANONYMOUS_PROOF_HREF;

export const WELCOME_PROOF_LADDER_SAMPLE_LABEL = "Healthcare Claims sample review";

export const WELCOME_PROOF_LADDER_SECONDARY_WALKTHROUGH_HREF = "/get-started" as const;

export const WELCOME_PROOF_LADDER_SECONDARY_WALKTHROUGH_LABEL = "Ready to start your evaluation?";

export const WELCOME_ILLUSTRATIVE_RETAIL_ROI_PDF_HREF = "/WORKED_EXAMPLE_ROI.pdf" as const;

export const WELCOME_ILLUSTRATIVE_RETAIL_ROI_PDF_LABEL = "Illustrative retail ROI (PDF)";

/** @deprecated Use {@link WELCOME_ILLUSTRATIVE_RETAIL_ROI_PDF_HREF}. */
export const WELCOME_CONTOSO_ROI_PDF_HREF = WELCOME_ILLUSTRATIVE_RETAIL_ROI_PDF_HREF;

/** @deprecated Use {@link WELCOME_ILLUSTRATIVE_RETAIL_ROI_PDF_LABEL}. */
export const WELCOME_CONTOSO_ROI_PDF_LABEL = WELCOME_ILLUSTRATIVE_RETAIL_ROI_PDF_LABEL;

export const WELCOME_ENGAGEMENT_PATHS_HEADING = "Other ways to engage";

export const WELCOME_PROBLEM_HEADING = "Architecture review is broken when diagrams are the only artifact";

export const WELCOME_PROBLEM_BODY =
  "Manual reviews are slow, inconsistent, and hard to defend under audit. Ad-hoc AI tools produce fluent prose with no evidence links, policy context, or durable record — leaving decisions buried in email and Confluence.";

export const WELCOME_SOLUTION_HEADING = "The outcome is a defensible review";

export const WELCOME_SOLUTION_BODY =
  "ArchLucid produces structured findings, recorded decisions, stated limits, and exports your ARB and security partners can follow — the same hosted workflow for a trial, the self-demo, or a service-led review.";

export type WelcomeWorkflowStep = {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
};

/** Canonical operator marketing vocabulary (GTM / demo script alignment). */
export const WELCOME_WORKFLOW_STEPS: readonly WelcomeWorkflowStep[] = [
  {
    id: "capture",
    label: "Capture",
    summary: "Architecture requests, structure hints, and supporting artifacts.",
  },
  {
    id: "evidence",
    label: "Evidence",
    summary: "An evidence graph linking sources to analysis.",
  },
  {
    id: "review",
    label: "Review",
    summary: "Governed multi-agent analysis with quality gates.",
  },
  {
    id: "findings",
    label: "Findings",
    summary: "Prioritized issues with severity and traceable claims.",
  },
  {
    id: "decisions",
    label: "Decisions",
    summary: "Approvals, overrides, and rationale — recorded.",
  },
  {
    id: "report",
    label: "Report",
    summary: "DOCX/PDF exports for ARB, audit, and procurement.",
  },
] as const;

export const WELCOME_WORKFLOW_INTRO =
  "One six-stage vocabulary shared by buyers, architects, and approval partners.";

export type WelcomeUseCaseCard = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  /** App route or in-app help path — must match the card theme (M-09 C8 routing). */
  readonly href: string;
  readonly ctaLabel: string;
};

const DEFAULT_POLICY_PACKS_HREF = resolveInAppDocHref("docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md");

export const WELCOME_USE_CASE_CARDS: readonly WelcomeUseCaseCard[] = [
  {
    id: "ai-governance-security",
    title: "AI policy + security baseline",
    body: "Responsible-AI and security-architecture rules seed every new tenant, so regulated reviews start review-ready instead of with an empty library.",
    // Workspace B Meridian/Alpine storyline — not WAF/CAF findings (M-06 C8).
    href: `/architecture/reviews/${DEMO_WORKSPACE_B_RUN_ID}`,
    ctaLabel: "Open regulated sample",
  },
  {
    id: "aws-waf",
    title: "AWS Well-Architected Framework",
    body: "Well-Architected themed rules across operational excellence, security, reliability, performance, cost, and sustainability — mapped to evidence, not checkboxes.",
    href: DEFAULT_POLICY_PACKS_HREF,
    ctaLabel: "View bundled policy packs",
  },
  {
    id: "gcp-architecture-framework",
    title: "Google Cloud Architecture Framework",
    body: "Google Cloud architecture and security themes for checking platform design, identity, and network patterns before ARB.",
    href: DEFAULT_POLICY_PACKS_HREF,
    ctaLabel: "View bundled policy packs",
  },
] as const;

/**
 * Provisioning transparency — aligns with `DefaultPolicyPackCatalog.StandardBaselineDisplayNames`
 * (Azure baseline at tenant create; AWS/GCP cloud-specific packs activate on run target — TB-717).
 */
export const WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE =
  "New workspaces include cloud-neutral security and FinOps packs. Works across clouds; rule coverage by cloud is documented. Azure Well-Architected and CIS Azure packs are enabled by default until you target AWS or Google Cloud in a review.";

/** Thematic-mapping disclaimer — must stay aligned with docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md §2. */
export const WELCOME_POLICY_PACK_DISCLAIMER =
  "Bundled policy packs use informative thematic mapping to accelerate architecture review. They do not constitute statutory legal classification, conformity assessment, CIS/OWASP/PCI/HIPAA/SOC 2 pass-fail automation, or Microsoft Well-Architected / CAF / landing-zone certification. Buyers remain responsible for jurisdictional applicability, contractual obligations, auditor evidence breadth, and any certification claims.";
