import contractJson from "../../../docs/library/ONBOARDING_NARRATIVE_SPINE_CONTRACT.json";

import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { FIRST_PILOT_OPERATING_RAIL_STEPS } from "@/lib/first-pilot-operating-rail-steps";

export type OnboardingNarrativeSpineSurface = {
  readonly id: string;
  readonly sourceModule: string;
  readonly titleField?: string;
  readonly labelField?: string;
  readonly requiredTitle?: string;
  readonly requiredLabel?: string;
  readonly requiredTitleContains?: string;
};

export type OnboardingNarrativeSpineContract = {
  readonly schemaVersion: number;
  readonly description: string;
  readonly stepOneSurfaces: readonly OnboardingNarrativeSpineSurface[];
  readonly bannedStepOneLeadPhrases: readonly string[];
};

/** TB-344: canonical first-run spine contract — evidence-first, not Azure-only lead framing. */
export const ONBOARDING_NARRATIVE_SPINE_CONTRACT =
  contractJson as OnboardingNarrativeSpineContract;

const FIRST_RUN_STEP_ONE_LABEL = "Provide architecture evidence";

export function listOnboardingNarrativeSpineMismatches(): string[] {
  const mismatches: string[] = [];
  const contract = ONBOARDING_NARRATIVE_SPINE_CONTRACT;

  const corePilotTitle = CORE_PILOT_STEPS[0]?.title ?? "";
  const ingestStep = FIRST_PILOT_OPERATING_RAIL_STEPS.find((step) => step.id === "ingest-evidence");
  const ingestTitle = ingestStep?.title ?? "";

  for (const surface of contract.stepOneSurfaces) {
    if (surface.id === "core-pilot-step-1" && surface.requiredTitle && corePilotTitle !== surface.requiredTitle) {
      mismatches.push(`${surface.id}: expected title "${surface.requiredTitle}", got "${corePilotTitle}"`);
    }

    if (
      surface.id === "operating-rail-ingest"
      && surface.requiredTitleContains
      && !ingestTitle.toLowerCase().includes(surface.requiredTitleContains.toLowerCase())
    ) {
      mismatches.push(
        `${surface.id}: title must contain "${surface.requiredTitleContains}", got "${ingestTitle}"`,
      );
    }

    if (surface.id === "first-review-empty-state-step-1" && surface.requiredLabel) {
      if (FIRST_RUN_STEP_ONE_LABEL !== surface.requiredLabel) {
        mismatches.push(
          `${surface.id}: expected label "${surface.requiredLabel}", contract requires sync with empty-state component`,
        );
      }
    }
  }

  for (const phrase of contract.bannedStepOneLeadPhrases) {
    if (corePilotTitle.toLowerCase().includes(phrase)) {
      mismatches.push(`core-pilot-step-1: banned lead phrase "${phrase}"`);
    }

    if (ingestTitle.toLowerCase().includes(phrase)) {
      mismatches.push(`operating-rail-ingest: banned lead phrase "${phrase}"`);
    }
  }

  return mismatches;
}
