"use client";

import { FormProvider } from "react-hook-form";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { WizardAiSuggestedFieldsProvider } from "@/lib/wizard-ai-suggested-fields";

import { useNewRunWizardClient } from "./use-new-run-wizard-client";

export type NewRunWizardClientProps = {
  /**
   * Panel-only mount inside `ReviewsNewPathSwitcher` (Templates and imports tab).
   * Forces templates-first full wizard and skips nested `OperatorPageContainer`.
   */
  readonly embeddedInPathSwitcher?: boolean;
};

/** Full wizard client: react-hook-form + zod, create run, poll summary with live region + toast. */
export function NewRunWizardClient(props: NewRunWizardClientProps = {}) {
  const { form, wizardReadyRef, embeddedInPathSwitcher, stepBody } = useNewRunWizardClient({
    embeddedInPathSwitcher: props.embeddedInPathSwitcher,
  });

  return (
    <FormProvider {...form}>
      <WizardAiSuggestedFieldsProvider>
        {embeddedInPathSwitcher ? (
          <div ref={wizardReadyRef} className="space-y-4 pb-36" data-testid="new-run-wizard-panel">
            {stepBody}
          </div>
        ) : (
          <OperatorPageContainer ref={wizardReadyRef} variant="workflow" className="space-y-4 pb-36">
            {stepBody}
          </OperatorPageContainer>
        )}
      </WizardAiSuggestedFieldsProvider>
    </FormProvider>
  );
}
