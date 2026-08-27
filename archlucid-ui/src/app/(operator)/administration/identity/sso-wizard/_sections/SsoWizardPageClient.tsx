"use client";

import { cn } from "@/lib/utils";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSsoWizardUnexpectedError } from "@/lib/sso-wizard-error-present";
import {
  SSO_WIZARD_IDP_STEP_INSTRUCTION,
  SSO_WIZARD_PROTOCOL_STEP_INSTRUCTION,
} from "@/lib/sso-wizard-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { SsoWizardFooter } from "./SsoWizardFooter";
import { SsoWizardPageChrome } from "./SsoWizardPageChrome";
import { SsoWizardStepContent } from "./SsoWizardStepContent";
import { useSsoWizardPage } from "./use-sso-wizard-page";

export function SsoWizardPageClient() {
  const wizard = useSsoWizardPage();

  return (
    <OperatorPageContainer variant="settings" className={cn(OPERATOR_LAYOUT.sectionStack, "px-1 sm:px-0")} data-testid="sso-wizard-page">
      <SsoWizardPageChrome
        existingConfigLoading={wizard.existingConfigLoading}
        existingConfigLoadError={wizard.existingConfigLoadError}
        existingConfigSummary={wizard.existingConfigSummary}
        wizardSession={wizard.wizardSession}
        step={wizard.step}
        completedSteps={wizard.completedSteps}
        handleStepSelect={wizard.handleStepSelect}
        configurationSaved={wizard.configurationSaved}
        setupChecklistSteps={wizard.setupChecklistSteps}
        setupChecklistEmphasizedStepId={wizard.setupChecklistEmphasizedStepId}
        error={wizard.error}
        successMessage={wizard.successMessage}
        pendingCancelConfirm={wizard.pendingCancelConfirm}
        setPendingCancelConfirm={wizard.setPendingCancelConfirm}
        leaveWizard={wizard.leaveWizard}
      />

      <Card>
        <CardHeader>
          <CardTitle
            as="h2"
            id="sso-wizard-step-heading"
            tabIndex={-1}
            className={OPERATOR_TYPOGRAPHY.cardTitle}
          >
            {wizard.stepHeading}
          </CardTitle>
          {wizard.step === 0 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{SSO_WIZARD_IDP_STEP_INSTRUCTION}</p>
          ) : null}
          {wizard.step === 1 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{SSO_WIZARD_PROTOCOL_STEP_INSTRUCTION}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          <SsoWizardStepContent
            step={wizard.step}
            state={wizard.state}
            busy={wizard.busy}
            existingConfigSummary={wizard.existingConfigSummary}
            onStateChange={wizard.setState}
            onRunDiscover={() => {
              void wizard.runDiscover();
            }}
            onRunTestLogin={() => {
              void wizard.runTestLogin();
            }}
          />

          <SsoWizardFooter
            isFirstStep={wizard.step === 0}
            isLastStep={wizard.isLastStep}
            canContinue={wizard.canProceed}
            canActivate={wizard.canActivate}
            busy={wizard.busy}
            primaryDisabledReason={wizard.primaryDisabledReason}
            onCancel={wizard.handleCancel}
            onBack={wizard.handleBack}
            onContinue={wizard.handleContinue}
            onActivate={() => {
              void wizard.runActivate().catch((activateError: unknown) => {
                wizard.setError(formatSsoWizardUnexpectedError(activateError));
              });
            }}
          />
        </CardContent>
      </Card>
    </OperatorPageContainer>
  );
}
