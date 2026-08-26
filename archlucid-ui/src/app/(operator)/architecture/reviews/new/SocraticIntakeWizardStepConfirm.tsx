"use client";

import { cn } from "@/lib/utils";

import { EvidenceGapForecastPanel } from "@/components/evidence/EvidenceGapForecastPanel";
import { InlineMetadataLabel } from "@/components/InlineMetadataLabel";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { WizardPolicyPackCloudMismatchCallout } from "@/components/wizard/WizardPolicyPackCloudMismatchCallout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { REVIEW_START_LOADING_LABEL } from "@/lib/review-start-progress-copy";
import {
  GUIDED_INTAKE_CONFIRMED_SCOPE_SUMMARY_HEADING,
  GUIDED_INTAKE_STEP2_SUBMIT_DESCRIPTION,
} from "@/lib/guided-intake-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { EvidencePresenceFlags } from "@/lib/evidence-gap-forecast";

import { GuidedIntakeRequestError } from "./GuidedIntakeRequestError";
import { INTAKE_STEPS } from "./guided-intake-steps";

export type SocraticIntakeWizardStepConfirmProps = {
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly systemName: string;
  readonly guidedIntakeEvidencePresence: EvidencePresenceFlags;
  readonly confirmedScopeLines: readonly string[];
  readonly submitError: unknown;
  readonly policyPackCloudMismatch: string | null;
  readonly busy: boolean;
  readonly canSubmit: boolean;
  readonly onBack: () => void;
  readonly onSubmit: () => void | Promise<void>;
};

export function SocraticIntakeWizardStepConfirm({
  freeTextIntent,
  businessOutcome,
  systemName,
  guidedIntakeEvidencePresence,
  confirmedScopeLines,
  submitError,
  policyPackCloudMismatch,
  busy,
  canSubmit,
  onBack,
  onSubmit,
}: SocraticIntakeWizardStepConfirmProps) {
  return (
    <Card data-testid="guided-intake-primary-panel">
      <CardHeader>
        <CardTitle>{INTAKE_STEPS[2].cardTitle}</CardTitle>
        <CardDescription>{GUIDED_INTAKE_STEP2_SUBMIT_DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className={cn("list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          <li>
            <InlineMetadataLabel label="Intent" />{" "}
            {freeTextIntent.trim().slice(0, 120)}
            {freeTextIntent.trim().length > 120 ? "…" : ""}
          </li>
          <li>
            <InlineMetadataLabel label="Outcome" /> {businessOutcome.trim()}
          </li>
          {systemName.trim() ? (
            <li>
              <InlineMetadataLabel label="System" /> {systemName.trim()}
            </li>
          ) : null}
        </ul>
        <EvidenceGapForecastPanel presence={guidedIntakeEvidencePresence} presentation="summary" />
        {confirmedScopeLines.length > 0 ? (
          <section className="space-y-1" data-testid="socratic-confirmed-scope-summary">
            <h3 className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.label)}>
              {GUIDED_INTAKE_CONFIRMED_SCOPE_SUMMARY_HEADING}
            </h3>
            <ul
              className={cn(
                "m-0 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300",
                OPERATOR_TYPOGRAPHY.helper,
              )}
            >
              {confirmedScopeLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {submitError !== null ? <GuidedIntakeRequestError error={submitError} /> : null}
        {policyPackCloudMismatch !== null ? (
          <WizardPolicyPackCloudMismatchCallout detail={policyPackCloudMismatch} />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={onBack}>
            Back to questions
          </Button>
          <ReviewStartLoadingButton
            type="button"
            disabled={!canSubmit}
            isLoading={busy}
            idleLabel={BUYER_START_ARCHITECTURE_REVIEW_CTA}
            loadingLabel={REVIEW_START_LOADING_LABEL}
            onClick={() => {
              void onSubmit();
            }}
            data-testid="socratic-submit"
          />
        </div>
      </CardContent>
    </Card>
  );
}
