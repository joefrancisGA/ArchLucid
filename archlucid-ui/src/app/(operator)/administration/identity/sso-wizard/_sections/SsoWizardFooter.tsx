"use client";

import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  SSO_WIZARD_ACTIVATE_LABEL,
  SSO_WIZARD_ACTIVATING_LABEL,
  SSO_WIZARD_BACK_STEP_LABEL,
  SSO_WIZARD_CANCEL_LABEL,
  SSO_WIZARD_CONTINUE_LABEL,
} from "@/lib/sso-wizard-copy";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";

export type SsoWizardFooterProps = {
  readonly isFirstStep: boolean;
  readonly isLastStep: boolean;
  readonly canContinue: boolean;
  readonly canActivate: boolean;
  readonly busy: boolean;
  readonly primaryDisabledReason?: WhyDisabledCtaReason | null;
  readonly continueLabel?: string;
  readonly onCancel: () => void;
  readonly onBack?: () => void;
  readonly onContinue?: () => void;
  readonly onActivate?: () => void;
};

export function SsoWizardFooter(props: SsoWizardFooterProps): React.JSX.Element {
  const showActivate = props.isLastStep;
  const showContinue = !props.isLastStep;
  const primaryDisabled = props.busy || (showActivate ? !props.canActivate : !props.canContinue);
  const continueLabel = props.continueLabel ?? SSO_WIZARD_CONTINUE_LABEL;

  return (
    <div
      className="mt-6 flex flex-col-reverse gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700 sm:flex-row sm:items-center sm:justify-between"
      data-testid="sso-wizard-footer"
    >
      <div className="flex flex-wrap gap-2">
        {props.isFirstStep ? (
          <Button type="button" variant="outline" disabled={props.busy} onClick={props.onCancel}>
            {SSO_WIZARD_CANCEL_LABEL}
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled={props.busy} onClick={props.onBack}>
            {SSO_WIZARD_BACK_STEP_LABEL}
          </Button>
        )}
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <div className="flex flex-wrap justify-end gap-2">
          {showContinue ? (
            <Button
              type="button"
              variant="primary"
              disabled={primaryDisabled}
              onClick={props.onContinue}
              data-testid="sso-wizard-continue"
              aria-describedby={primaryDisabled ? "sso-wizard-primary-disabled-hint" : undefined}
            >
              {props.busy ? "Continuing…" : continueLabel}
            </Button>
          ) : null}

          {showActivate ? (
            <Button
              type="button"
              variant="primary"
              disabled={primaryDisabled}
              onClick={props.onActivate}
              data-testid="sso-wizard-activate"
              aria-describedby={primaryDisabled ? "sso-wizard-primary-disabled-hint" : undefined}
            >
              {props.busy ? SSO_WIZARD_ACTIVATING_LABEL : SSO_WIZARD_ACTIVATE_LABEL}
            </Button>
          ) : null}
        </div>
        <WhyDisabledCtaHint
          id="sso-wizard-primary-disabled-hint"
          reason={primaryDisabled ? props.primaryDisabledReason : null}
          testId="sso-wizard-primary-disabled-hint"
          className="max-w-prose text-right sm:text-right"
        />
      </div>
    </div>
  );
}
