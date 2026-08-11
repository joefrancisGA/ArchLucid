import { ARCHITECTURE_REVIEW_VOCABULARY } from "@/lib/vocabulary/architecture-review-vocabulary";
import { FIRST_PILOT_BUYER_COPY } from "@/lib/first-pilot-buyer-copy";
import {
  ONBOARDING_TOUR_DONE_LINK_HREF,
  ONBOARDING_TOUR_DONE_LINK_LABEL,
  ONBOARDING_TOUR_FOLLOW_WORKFLOW_BODY,
  ONBOARDING_TOUR_GET_HELP_BODY,
  ONBOARDING_TOUR_NEW_REVIEW_BODY,
  ONBOARDING_TOUR_READY_BODY,
  ONBOARDING_TOUR_REVIEW_PACKAGES_BODY,
  ONBOARDING_TOUR_WELCOME_BODY,
  OPERATOR_ONBOARDING_TOUR_STEPS,
  type OperatorOnboardingTourStepCopy,
} from "@/lib/operator-onboarding-tour-steps";

export {
  ONBOARDING_TOUR_DONE_LINK_HREF,
  ONBOARDING_TOUR_DONE_LINK_LABEL,
  ONBOARDING_TOUR_FOLLOW_WORKFLOW_BODY,
  ONBOARDING_TOUR_GET_HELP_BODY,
  ONBOARDING_TOUR_NEW_REVIEW_BODY,
  ONBOARDING_TOUR_READY_BODY,
  ONBOARDING_TOUR_REVIEW_PACKAGES_BODY,
  ONBOARDING_TOUR_WELCOME_BODY,
  OPERATOR_ONBOARDING_TOUR_STEPS,
  type OperatorOnboardingTourStepCopy,
};

/** Canonical opt-in tour step — evidence-first with optional cloud inventory ZIP (TB-342). */
export const OPT_IN_TOUR_EVIDENCE_STEP = {
  title: "2. Provide architecture evidence",
  body:
    "Add a brief, documents, diagrams, or IaC in the new-review wizard — or upload a cloud inventory ZIP (AWS, Azure, or GCP) from Settings → Extract & upload when you want production-faithful account inventory. Explore a sample review anytime without providing your own evidence.",
} as const;

/** Operator welcome modal step — no cloud prerequisite (TB-342). */
export const WELCOME_OPERATOR_EVIDENCE_STEP = {
  title: "Provide architecture evidence",
  description:
    `Start with a brief, documents, or an optional cloud inventory ZIP — cloud connectors are accelerators, not prerequisites. ${ARCHITECTURE_REVIEW_VOCABULARY.runIdBridgeSentence} The new review wizard keeps you on the path to a finalized package.`,
} as const;

/** First-visit help banner on operator home (TB-342). */
export const FIRST_VISIT_HELP_THREE_THINGS =
  "start one review, explore a sample review, then invite a reviewer for sign-off.";

/** Phrases that must not appear in first-run tour copy (implementation / internal jargon). */
export const ONBOARDING_TOUR_BANNED_PHRASES: readonly string[] = [
  "manifest",
  "core pilot",
  "more destinations",
  "replay",
  "wizard",
] as const;

/** Readiness cockpit optional cloud inventory ZIP row — Azure/AWS/GCP accelerators (TB-342). */
export const READINESS_CLOUD_EVIDENCE_LABEL = "Tier-1 cloud inventory ZIP";

/** @deprecated Prefer {@link READINESS_CLOUD_EVIDENCE_LABEL} — Azure-only name retained for legacy imports. */
export const READINESS_AZURE_EXTRACTOR_LABEL = READINESS_CLOUD_EVIDENCE_LABEL;

export const READINESS_AZURE_EXTRACTOR_CTA = "Add evidence";

export function buildReadinessCloudEvidenceSummary(evidenceReady: boolean, runsLoadFailed: boolean): string {
  if (evidenceReady) {
    return "Evidence is attached, acknowledged, or already committed for the pilot path.";
  }

  if (runsLoadFailed) {
    return FIRST_PILOT_BUYER_COPY.ingestEvidenceWithoutUpload;
  }

  return "Run Get-ArchLucidAzurePackage.ps1, Get-ArchLucidAwsPackage.ps1, or Get-ArchLucidGcpPackage.ps1 locally, validate manifest.json + resources.json, then upload from the new-review wizard.";
}

/** @deprecated Prefer {@link buildReadinessCloudEvidenceSummary} — Azure-only name retained for legacy imports. */
export const buildReadinessAzureExtractorSummary = buildReadinessCloudEvidenceSummary;

/** Phrases that imply Azure is required before the first review (TB-342 guard). */
export const ONBOARDING_SECONDARY_BANNED_PHRASES: readonly string[] = [
  "needs to know about your azure environment",
  "upload your azure environment",
  "upload azure architecture context",
  "connect azure before",
  "must connect azure",
  "optional azure export",
  "upload an azure export",
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
