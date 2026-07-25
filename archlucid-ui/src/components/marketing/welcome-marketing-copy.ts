/** Homepage marketing copy — aligned to service-led GTM (pain → outcome → report). */

import { DEMO_WORKSPACE_B_RUN_ID } from "@/lib/demo-workspace-scope";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

export const WELCOME_HERO_PITCH =
  "Turn scattered architecture evidence into an evidence-backed review your ARB can trust — prioritized findings, explicit limits where we do not conclude, and an exportable report in days instead of weeks. ArchLucid runs a governed workflow from capture through report so every claim traces to proof, not a chat transcript that disappears.";

export const WELCOME_HERO_CTA_SUBHEADING =
  "See an architecture review built for governance — not slide decks alone.";

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
  "Inspect a governed sample review with fabricated data, then bring your own architecture evidence when ready. Every finding traces to evidence; every governance decision leaves an audit trail. No sales call required.";

export const WELCOME_PROBLEM_HEADING = "Architecture review is broken when diagrams are the only artifact";

export const WELCOME_PROBLEM_BODY =
  "Manual reviews are slow, inconsistent, and hard to defend under audit. Ad-hoc AI tools produce fluent prose without evidence links, policy context, or a durable record. Teams still ship decisions on opinions buried in email and Confluence — not a review stakeholders can replay.";

export const WELCOME_SOLUTION_HEADING = "The outcome is a defensible review";

export const WELCOME_SOLUTION_BODY =
  "ArchLucid delivers a prioritized, evidence-linked architecture review: structured findings, recorded decisions, stated limits, and exports your ARB and security partners can follow. Same hosted workflow whether you start a trial, open the self-demo, or engage us for a service-led review.";

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
    summary: "Ingest architecture requests, topology, and supporting artifacts — including bulk evidence upload.",
  },
  {
    id: "evidence",
    label: "Evidence",
    summary: "Build an evidence graph that ties sources to what the pipeline examined.",
  },
  {
    id: "review",
    label: "Review",
    summary: "Run governed multi-agent analysis with quality gates — not a one-shot chat.",
  },
  {
    id: "findings",
    label: "Findings",
    summary: "Surface prioritized issues with severity, category, and traceable claims.",
  },
  {
    id: "decisions",
    label: "Decisions",
    summary: "Record approvals, overrides, and rationale on the decision trail.",
  },
  {
    id: "report",
    label: "Report",
    summary: "Export DOCX/PDF and whitelabeled packages for ARB, audit, and procurement.",
  },
] as const;

export const WELCOME_WORKFLOW_INTRO =
  "Every service-led engagement and self-demo walkthrough follows the same six-stage vocabulary — so buyers, operators, and governance partners share one mental model.";

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
    title: "AI governance + security baseline",
    body: "Default bundled policy packs seed responsible-AI and security-architecture rules on every new tenant — ready for regulated and cloud-native reviews without building packs from scratch.",
    // Workspace B Meridian/Alpine storyline — not WAF/CAF findings (M-06 C8).
    href: `/reviews/${DEMO_WORKSPACE_B_RUN_ID}`,
    ctaLabel: "Open regulated sample",
  },
  {
    id: "aws-waf",
    title: "AWS Well-Architected Framework",
    body: "Curated Well-Architected themed compliance rules accelerate cloud posture reviews across operational excellence, security, reliability, performance, cost, and sustainability — mapped to architecture evidence, not checkbox theater.",
    href: DEFAULT_POLICY_PACKS_HREF,
    ctaLabel: "View bundled policy packs",
  },
  {
    id: "gcp-architecture-framework",
    title: "Google Cloud Architecture Framework",
    body: "Google Cloud architecture and security themes help teams sanity-check platform design, identity, and network patterns before ARB — especially for Google Cloud–first estates.",
    href: DEFAULT_POLICY_PACKS_HREF,
    ctaLabel: "View bundled policy packs",
  },
] as const;

/**
 * Provisioning transparency — aligns with `DefaultPolicyPackCatalog.StandardBaselineDisplayNames`
 * (Azure baseline at tenant create; AWS/GCP cloud-specific packs activate on run target — TB-717).
 */
export const WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE =
  "New workspaces include cloud-neutral security and FinOps packs; Azure Well-Architected and CIS Azure packs are enabled by default until you target AWS or Google Cloud in a review.";

/** Thematic-mapping disclaimer — must stay aligned with docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md §2. */
export const WELCOME_POLICY_PACK_DISCLAIMER =
  "Bundled policy packs use informative thematic mapping to accelerate architecture review. They do not constitute statutory legal classification, conformity assessment, CIS/OWASP/PCI/HIPAA/SOC 2 pass-fail automation, or Microsoft Well-Architected / CAF / landing-zone certification. Buyers remain responsible for jurisdictional applicability, contractual obligations, auditor evidence breadth, and any certification claims.";
