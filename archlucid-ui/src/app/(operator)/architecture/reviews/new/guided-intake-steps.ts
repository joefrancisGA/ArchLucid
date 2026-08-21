import { CREATE_REVIEW_PACKAGE_HEADING } from "@/lib/buyer/buyer-polish-copy";
import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS,
  GUIDED_INTAKE_STEP0_CARD_DESCRIPTION,
  GUIDED_INTAKE_STEP0_CARD_TITLE,
  GUIDED_INTAKE_STEP0_PROGRESS_LABEL,
  GUIDED_INTAKE_STEP2_CARD_DESCRIPTION,
} from "@/lib/guided-intake-copy";
import type { WizardStepDefinition } from "@/lib/wizard-step-sequence";
import type { ActorSet } from "@/types/draft-intake";

/** Shortest brief the admission gate will accept. */
export const MIN_INTENT_CHARS = GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS;

/** Shortest business outcome the admission gate will accept. */
export const MIN_OUTCOME_CHARS = 10;

/** Guided intake slides: brief, clarifications, submit. */
export const INTAKE_STEPS = [
  {
    progressLabel: GUIDED_INTAKE_STEP0_PROGRESS_LABEL,
    cardTitle: GUIDED_INTAKE_STEP0_CARD_TITLE,
    description: GUIDED_INTAKE_STEP0_CARD_DESCRIPTION,
  },
  {
    progressLabel: "Required clarifications",
    cardTitle: "Required clarifications",
    description: "Answer a few clarifying questions so ArchLucid can produce a precise review.",
  },
  {
    progressLabel: CREATE_REVIEW_PACKAGE_HEADING,
    cardTitle: CREATE_REVIEW_PACKAGE_HEADING,
    description: GUIDED_INTAKE_STEP2_CARD_DESCRIPTION,
  },
] as const;

/** Step shape the shared wizard navigation hook expects. */
export const INTAKE_STEP_DEFINITIONS: readonly WizardStepDefinition[] = INTAKE_STEPS.map((step) => ({
  label: step.progressLabel,
  description: step.description,
}));

/** WizardStepper metadata — same order as {@link INTAKE_STEPS}. */
export const INTAKE_WIZARD_STEPPER_STEPS = INTAKE_STEP_DEFINITIONS.map((step) => ({
  label: step.label,
  description: step.description,
}));

/** Snapshot persisted so a reload can resume guided intake where it stopped. */
export type GuidedIntakeSessionState = {
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly systemName: string;
  readonly actorSet: ActorSet;
  readonly answers: Record<string, string>;
  readonly draftId: string | null;
};
