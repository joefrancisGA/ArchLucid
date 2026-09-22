import { wizardSessionHasTextContent } from "@/lib/wizard-session-persistence";

export type GuidedIntakeWizardUnsavedInput = {
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly systemName: string;
  readonly answers: Readonly<Record<string, string>>;
  readonly draftId: string | null;
  readonly step: number;
  readonly isSubmitBlocked: boolean;
};

/** True when the guided intake wizard has in-progress edits that are not yet submitted (LW-075). */
export function guidedIntakeWizardHasUnsavedEdits(input: GuidedIntakeWizardUnsavedInput): boolean {
  if (input.isSubmitBlocked) {
    return false;
  }

  if (input.step > 0) {
    return true;
  }

  if (input.draftId !== null) {
    return true;
  }

  if (wizardSessionHasTextContent(input.freeTextIntent)) {
    return true;
  }

  if (wizardSessionHasTextContent(input.businessOutcome)) {
    return true;
  }

  if (wizardSessionHasTextContent(input.systemName)) {
    return true;
  }

  for (const answer of Object.values(input.answers)) {
    if (wizardSessionHasTextContent(answer)) {
      return true;
    }
  }

  return false;
}
