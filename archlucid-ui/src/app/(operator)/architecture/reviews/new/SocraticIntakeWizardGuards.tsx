"use client";

import {
  LivelihoodDocumentGuardDialog,
  useLivelihoodDocumentGuards,
} from "@/hooks/use-livelihood-document-guards";
import { guidedIntakeWizardHasUnsavedEdits } from "@/lib/architecture/guided-intake-wizard-unsaved";

export const SOCRATIC_INTAKE_WIZARD_UNSAVED_MESSAGE =
  "You have an in-progress intake brief. Leave this page without submitting?";

export type SocraticIntakeWizardGuardsProps = {
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly systemName: string;
  readonly answers: Readonly<Record<string, string>>;
  readonly draftId: string | null;
  readonly step: number;
  readonly isSubmitBlocked: boolean;
};

/** Document guards for the guided intake wizard (LW-075). */
export function SocraticIntakeWizardGuards(props: SocraticIntakeWizardGuardsProps): React.JSX.Element {
  const hasUnsavedEdits = guidedIntakeWizardHasUnsavedEdits({
    freeTextIntent: props.freeTextIntent,
    businessOutcome: props.businessOutcome,
    systemName: props.systemName,
    answers: props.answers,
    draftId: props.draftId,
    step: props.step,
    isSubmitBlocked: props.isSubmitBlocked,
  });
  const documentGuards = useLivelihoodDocumentGuards({
    when: hasUnsavedEdits,
    message: SOCRATIC_INTAKE_WIZARD_UNSAVED_MESSAGE,
  });

  return (
    <LivelihoodDocumentGuardDialog
      message={documentGuards.dialogMessage}
      onCancelLeave={documentGuards.cancelLeave}
      onConfirmLeave={documentGuards.confirmLeave}
      open={documentGuards.dialogOpen}
    />
  );
}
