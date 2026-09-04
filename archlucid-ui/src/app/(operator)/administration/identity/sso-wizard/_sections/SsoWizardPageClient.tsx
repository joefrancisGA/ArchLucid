"use client";

import { cn } from "@/lib/utils";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { formatSsoWizardUnexpectedError } from "@/lib/sso-wizard-error-present";
import {
  SSO_WIZARD_IDP_STEP_INSTRUCTION,
  SSO_WIZARD_PROTOCOL_STEP_INSTRUCTION,
} from "@/lib/sso-wizard-copy";
import {
  SSO_WIZARD_SETTINGS_PRIMARY_CONTENT_ID,
  SSO_WIZARD_SETTINGS_SKIP_LINK_LABEL,
  SSO_WIZARD_SETTINGS_SKIP_TARGET_ID,
} from "@/lib/sso-wizard-settings-page-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  LivelihoodDocumentGuardDialog,
  useLivelihoodDocumentGuards,
} from "@/hooks/use-livelihood-document-guards";

import { SsoWizardFooter } from "./SsoWizardFooter";
import { SsoWizardPageChrome } from "./SsoWizardPageChrome";
import { SsoWizardStepContent } from "./SsoWizardStepContent";
import { ssoWizardHasUnsavedChanges } from "./sso-wizard-state";
import { useSsoWizardPage } from "./use-sso-wizard-page";

export function SsoWizardPageClient() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const wizard = useSsoWizardPage();
  const documentGuards = useLivelihoodDocumentGuards({
    when: ssoWizardHasUnsavedChanges(wizard.state, wizard.step),
  });

  return (
    <OperatorPageContainer variant="settings" className={cn(OPERATOR_LAYOUT.sectionStack, "px-1 sm:px-0")} data-testid="sso-wizard-page">
      {buyerPolishedShell ? (
        <a
          href={`#${SSO_WIZARD_SETTINGS_SKIP_TARGET_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {SSO_WIZARD_SETTINGS_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <div
        id={buyerPolishedShell ? SSO_WIZARD_SETTINGS_PRIMARY_CONTENT_ID : undefined}
        data-testid={buyerPolishedShell ? SSO_WIZARD_SETTINGS_PRIMARY_CONTENT_ID : undefined}
        className={buyerPolishedShell ? cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack) : OPERATOR_LAYOUT.sectionStack}
      >
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
      </div>
      <LivelihoodDocumentGuardDialog
        open={documentGuards.dialogOpen}
        message={documentGuards.dialogMessage}
        onConfirmLeave={documentGuards.confirmLeave}
        onCancelLeave={documentGuards.cancelLeave}
      />
    </OperatorPageContainer>
  );
}
