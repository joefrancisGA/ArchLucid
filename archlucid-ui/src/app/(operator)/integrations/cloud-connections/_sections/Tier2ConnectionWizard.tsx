"use client";

import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { Button } from "@/components/ui/button";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";

import { CloudSecurityPreflightPanel } from "./CloudSecurityPreflightPanel";
import { Tier2ConnectionIdsStep } from "./Tier2ConnectionIdsStep";
import { Tier2ConnectionSecurityStep } from "./Tier2ConnectionSecurityStep";
import { Tier2ConnectionValidateStep } from "./Tier2ConnectionValidateStep";
import { useTier2ConnectionWizard, type Tier2ConnectionWizardProps } from "./use-tier2-connection-wizard";

export type { Tier2ConnectionWizardProps };

export function Tier2ConnectionWizard({
  onSaved,
  skipSecurityStep = false,
  initialConnection = null,
  onCancelEdit,
}: Tier2ConnectionWizardProps) {
  const wizard = useTier2ConnectionWizard({ onSaved, skipSecurityStep, initialConnection });

  return (
    <div className={OPERATOR_LAYOUT.sectionStack} data-testid="tier2-connection-wizard">
      <WizardStepper
        steps={wizard.wizardSteps}
        currentStep={wizard.step}
        completedSteps={wizard.completedSteps}
      />

      {!wizard.skipSecurityStep && wizard.step === 0 ? (
        <section className="space-y-4" aria-labelledby="tier2-wizard-security-heading">
          <CloudSecurityPreflightPanel
            topics={cloudSecurityPreflightTopics("azure")}
            providerLabel="Azure"
            collapsedByDefault={false}
            verifiedTopics={wizard.verifiedTopics}
          />
        </section>
      ) : null}

      {wizard.logicalStep === 1 ? (
        <Tier2ConnectionSecurityStep
          federationIdentifiers={wizard.federationIdentifiers}
          setupScript={wizard.setupScript}
          handleCopyIdentifier={wizard.handleCopyIdentifier}
          handleCopyScript={wizard.handleCopyScript}
        />
      ) : null}

      {wizard.logicalStep === 2 ? (
        <Tier2ConnectionIdsStep
          tenantId={wizard.tenantId}
          setTenantId={wizard.setTenantId}
          clientId={wizard.clientId}
          setClientId={wizard.setClientId}
          subscriptionIds={wizard.subscriptionIds}
          setSubscriptionIds={wizard.setSubscriptionIds}
          displayFieldErrors={wizard.displayFieldErrors}
          clearFieldError={wizard.clearFieldError}
        />
      ) : null}

      {wizard.logicalStep === 3 ? (
        <Tier2ConnectionValidateStep
          workspaceBindingLabel={wizard.workspaceBindingLabel}
          workspaceBindingCallout={wizard.workspaceBindingCallout}
          tenantId={wizard.tenantId}
          clientId={wizard.clientId}
          subscriptionIds={wizard.subscriptionIds}
          savedConnection={wizard.savedConnection}
          isValidating={wizard.isValidating}
          canRunValidation={wizard.canRunValidation}
          handleValidateHostedRun={wizard.handleValidateHostedRun}
          validationMessage={wizard.validationMessage}
          validationSucceeded={wizard.validationSucceeded}
          verifiedTopics={wizard.verifiedTopics}
          canMutate={wizard.canMutate}
        />
      ) : null}

      {wizard.saveErrorMessage !== null ? (
        <OperatorMutationInlineError
          message={wizard.saveErrorMessage}
          testId="tier2-connection-save-inline-error"
        />
      ) : null}

      <WizardNavButtons
        isFirstStep={wizard.step === 0}
        isLastInputStep={wizard.step === wizard.wizardSteps.length - 1}
        canProceed={wizard.canProceed}
        canSubmit={wizard.canSubmit}
        submitting={wizard.isSaving}
        onBack={wizard.step > 0 ? wizard.handleBack : undefined}
        onNext={wizard.step < wizard.wizardSteps.length - 1 ? wizard.handleNext : undefined}
        onSubmit={wizard.step === wizard.wizardSteps.length - 1 ? () => void wizard.handleSave() : undefined}
        submitLabel={wizard.isEditing ? "Update connection" : "Save connection"}
        submittingLabel="Saving…"
      />

      {onCancelEdit !== undefined ? (
        <Button type="button" variant="outline" data-testid="tier2-cancel-edit" onClick={onCancelEdit}>
          Cancel update
        </Button>
      ) : null}
    </div>
  );
}
