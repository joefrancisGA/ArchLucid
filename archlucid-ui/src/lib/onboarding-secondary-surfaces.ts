import { ARCHITECTURE_REVIEW_VOCABULARY } from "@/lib/architecture-review-vocabulary";
import { FIRST_PILOT_BUYER_COPY } from "@/lib/first-pilot-buyer-copy";

/** Canonical opt-in tour step — evidence-first with Azure as optional accelerator (TB-342). */
export const OPT_IN_TOUR_EVIDENCE_STEP = {
  title: "2. Provide architecture evidence",
  body:
    "Add a brief, documents, diagrams, or IaC in the new-review wizard — or upload an Azure export from Settings → Extract & upload when you want production-faithful subscription inventory. Explore a sample review anytime without providing your own evidence.",
} as const;

/** Operator welcome modal step — no Azure prerequisite (TB-342). */
export const WELCOME_OPERATOR_EVIDENCE_STEP = {
  title: "Provide architecture evidence",
  description:
    `Start with a brief, documents, or an optional Azure export — cloud connectors are accelerators, not prerequisites. ${ARCHITECTURE_REVIEW_VOCABULARY.runIdBridgeSentence} The new review wizard keeps you on the path to a finalized package.`,
} as const;

/** First-visit help banner on operator home (TB-342). */
export const FIRST_VISIT_HELP_THREE_THINGS =
  "start one review package, explore a sample package if you are not ready to provide your own evidence yet, then invite a reviewer when you want governance sign-off.";

/** Operator first-run tour welcome step — workflow-oriented, not pipeline jargon (TB-342). */
export const ONBOARDING_TOUR_WELCOME_BODY =
  "ArchLucid turns architecture evidence into findings, decisions, and review packages. Complete the steps in order, or jump ahead when you are ready.";

/** Operator first-run tour start-review step (TB-342). */
export const ONBOARDING_TOUR_NEW_REVIEW_BODY =
  "Use Start review to open the guided intake. Each review begins with architecture evidence: a brief, uploaded files, or an optional Azure export.";

/** Operator first-run tour review-packages step. */
export const ONBOARDING_TOUR_REVIEW_PACKAGES_BODY =
  "Completed reviews produce review packages with findings, evidence, decisions, and an audit trail. Track recent activity here, or open the full list when you need every review in the workspace.";

/** Operator first-run tour workflow step. */
export const ONBOARDING_TOUR_FOLLOW_WORKFLOW_BODY =
  "Use Review work to move between intake, evidence, review packages, and portfolio views. Administration stays collapsed unless you need tenant or project settings.";

/** Operator first-run tour help step. */
export const ONBOARDING_TOUR_GET_HELP_BODY =
  "Open Help for the product guide, documentation index, and this tour. You can restart the tour anytime from Help.";

/** Operator first-run tour closing step. */
export const ONBOARDING_TOUR_READY_BODY =
  "Start with one review package. Use the pilot checklist when you want a guided path from first review to governance sign-off.";

export const ONBOARDING_TOUR_DONE_LINK_LABEL = "Open pilot checklist";

export const ONBOARDING_TOUR_DONE_LINK_HREF = "/onboarding";

export type OperatorOnboardingTourStepCopy = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly targetSelector?: string;
};

/** Canonical six-step operator first-run tour copy — titles and bodies only. */
export const OPERATOR_ONBOARDING_TOUR_STEPS: readonly OperatorOnboardingTourStepCopy[] = [
  {
    id: "welcome",
    title: "Welcome to ArchLucid",
    body: ONBOARDING_TOUR_WELCOME_BODY,
    targetSelector: '[data-onboarding="tour-core-pilot"]',
  },
  {
    id: "new-run",
    title: "Start a review",
    body: ONBOARDING_TOUR_NEW_REVIEW_BODY,
    targetSelector: '[data-onboarding="tour-new-run"]',
  },
  {
    id: "runs",
    title: "Review packages",
    body: ONBOARDING_TOUR_REVIEW_PACKAGES_BODY,
    targetSelector: '[data-onboarding="tour-runs-dashboard"]',
  },
  {
    id: "disclose",
    title: "Follow the workflow",
    body: ONBOARDING_TOUR_FOLLOW_WORKFLOW_BODY,
    targetSelector: '[data-onboarding="tour-nav-settings"]',
  },
  {
    id: "help",
    title: "Get help",
    body: ONBOARDING_TOUR_GET_HELP_BODY,
    targetSelector: '[data-onboarding="tour-help"]',
  },
  {
    id: "done",
    title: "You are ready",
    body: ONBOARDING_TOUR_READY_BODY,
  },
] as const;

/** Phrases that must not appear in first-run tour copy (implementation / internal jargon). */
export const ONBOARDING_TOUR_BANNED_PHRASES: readonly string[] = [
  "manifest",
  "core pilot",
  "more destinations",
  "replay",
  "wizard",
] as const;

/** Readiness cockpit optional Azure row — tertiary accelerator framing (TB-342). */
export const READINESS_AZURE_EXTRACTOR_LABEL = "Optional Azure export evidence";

export const READINESS_AZURE_EXTRACTOR_CTA = "Add evidence";

export function buildReadinessAzureExtractorSummary(evidenceReady: boolean, runsLoadFailed: boolean): string {
  if (evidenceReady) {
    return "Evidence is attached, acknowledged, or already committed for the pilot path.";
  }

  if (runsLoadFailed) {
    return FIRST_PILOT_BUYER_COPY.ingestEvidenceWithoutUpload;
  }

  return "Add a brief, documents, or an Azure export — or use the sample package. No customer-tenant write role is required.";
}

/** Phrases that imply Azure is required before the first review (TB-342 guard). */
export const ONBOARDING_SECONDARY_BANNED_PHRASES: readonly string[] = [
  "needs to know about your azure environment",
  "upload your azure environment",
  "upload azure architecture context",
  "connect azure before",
  "must connect azure",
] as const;

export function listOnboardingSecondarySurfaceViolations(surfaces: Readonly<Record<string, string>>): string[] {
  const violations: string[] = [];

  for (const [surfaceId, text] of Object.entries(surfaces)) {
    const normalized = text.toLowerCase();

    for (const phrase of ONBOARDING_SECONDARY_BANNED_PHRASES) {
      if (normalized.includes(phrase)) {
        violations.push(`${surfaceId}: banned phrase "${phrase}"`);
      }
    }
  }

  return violations;
}

export function listOnboardingTourCopyViolations(
  steps: ReadonlyArray<Pick<OperatorOnboardingTourStepCopy, "id" | "title" | "body">> = OPERATOR_ONBOARDING_TOUR_STEPS,
): string[] {
  const violations: string[] = [];

  for (const step of steps) {
    const normalized = `${step.title} ${step.body}`.toLowerCase();

    for (const phrase of ONBOARDING_TOUR_BANNED_PHRASES) {
      if (normalized.includes(phrase)) {
        violations.push(`${step.id}: banned phrase "${phrase}"`);
      }
    }
  }

  return violations;
}
