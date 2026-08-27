"use client";

import { cn } from "@/lib/utils";

import { DraftIntakeActorEditor } from "@/components/draft-intake/DraftIntakeActorEditor";
import { ReviewAssuranceCoverageSection } from "@/components/wizard/ReviewAssuranceCoverageSection";
import { ArchitectureScopeUnderstandingCheckPanel } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IntakeFieldLabel } from "@/components/intake/IntakeFieldLabel";
import { CREATE_ARCHITECTURE_STARTING_LABEL } from "@/lib/review-start-progress-copy";
import {
  OPERATOR_FORM_FIELD_HELPER_CLASS,
  OPERATOR_FORM_FIELD_STACK_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_PLACEHOLDER,
  GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER,
  GUIDED_INTAKE_CONTINUE_TO_CLARIFICATIONS,
  GUIDED_INTAKE_CONTINUE_TO_DISCOVERY,
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER,
  GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL,
  GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_MIN_HELPER,
  GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL,
  GUIDED_INTAKE_CREATION_SYSTEM_NAME_PLACEHOLDER,
  guidedIntakeArchitectureIntentHelperText,
  guidedIntakeCreationArchitectureOverviewHelperText,
} from "@/lib/guided-intake-copy";
import {
  type DeriveScopeUnderstandingBulletsInput,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import type { ActorSet } from "@/types/draft-intake";
import type { Dispatch, SetStateAction } from "react";

import { GuidedIntakeRequestError } from "./GuidedIntakeRequestError";
import { INTAKE_STEPS, MIN_OUTCOME_CHARS } from "./guided-intake-steps";

export type SocraticIntakeWizardStepScopeProps = {
  readonly isCreateArchitectureFlow: boolean;
  readonly busy: boolean;
  readonly systemName: string;
  readonly setSystemName: (value: string) => void;
  readonly freeTextIntent: string;
  readonly setFreeTextIntent: (value: string) => void;
  readonly businessOutcome: string;
  readonly setBusinessOutcome: (value: string) => void;
  readonly actorSet: ActorSet;
  readonly setActorSet: (value: ActorSet) => void;
  readonly focusedPilotModeEnabled: boolean;
  readonly setFocusedPilotModeEnabled: (value: boolean) => void;
  readonly intentFieldLabel: string;
  readonly intentTrimmedLength: number;
  readonly intentMeetsMinimum: boolean;
  readonly outcomeTrimmedLength: number;
  readonly outcomeMeetsMinimum: boolean;
  readonly scopeUnderstandingInput: DeriveScopeUnderstandingBulletsInput;
  readonly setScopeBullets: Dispatch<SetStateAction<ScopeUnderstandingBullet[]>>;
  readonly setScopeGateOpen: (open: boolean) => void;
  readonly canAdvanceIntent: boolean;
  readonly advanceHint: string;
  readonly submitError: unknown;
  readonly onCreateArchitectureContinuation: () => void | Promise<void>;
  readonly onAdmission: () => void | Promise<void>;
};

export function SocraticIntakeWizardStepScope({
  isCreateArchitectureFlow,
  busy,
  systemName,
  setSystemName,
  freeTextIntent,
  setFreeTextIntent,
  businessOutcome,
  setBusinessOutcome,
  actorSet,
  setActorSet,
  focusedPilotModeEnabled,
  setFocusedPilotModeEnabled,
  intentFieldLabel,
  intentTrimmedLength,
  intentMeetsMinimum,
  outcomeTrimmedLength,
  outcomeMeetsMinimum,
  scopeUnderstandingInput,
  setScopeBullets,
  setScopeGateOpen,
  canAdvanceIntent,
  advanceHint,
  submitError,
  onCreateArchitectureContinuation,
  onAdmission,
}: SocraticIntakeWizardStepScopeProps) {
  return (
    <Card data-testid="guided-intake-primary-panel">
      {!isCreateArchitectureFlow ? (
        <CardHeader>
          <CardTitle>{INTAKE_STEPS[0].cardTitle}</CardTitle>
          <CardDescription>{INTAKE_STEPS[0].description}</CardDescription>
        </CardHeader>
      ) : null}
      <CardContent className={cn(OPERATOR_LAYOUT.sectionStack, isCreateArchitectureFlow && "pt-4")}>
        {isCreateArchitectureFlow ? (
          <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
            <IntakeFieldLabel
              htmlFor="socratic-system-name"
              label={GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL}
              required
            />
            <Input
              id="socratic-system-name"
              value={systemName}
              onChange={(event) => setSystemName(event.target.value)}
              disabled={busy}
              placeholder={GUIDED_INTAKE_CREATION_SYSTEM_NAME_PLACEHOLDER}
              data-testid="socratic-system-name"
              aria-required
            />
          </div>
        ) : null}

        <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
          <IntakeFieldLabel htmlFor="socratic-intent" label={intentFieldLabel} required />
          <Textarea
            id="socratic-intent"
            value={freeTextIntent}
            onChange={(event) => setFreeTextIntent(event.target.value)}
            rows={isCreateArchitectureFlow ? 4 : 3}
            disabled={busy}
            placeholder={
              isCreateArchitectureFlow
                ? GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER
                : GUIDED_INTAKE_ARCHITECTURE_INTENT_PLACEHOLDER
            }
            data-testid="socratic-intent"
            aria-invalid={intentTrimmedLength > 0 && !intentMeetsMinimum}
            aria-describedby="socratic-intent-helper"
            aria-required
          />
          <p
            id="socratic-intent-helper"
            className={cn(OPERATOR_FORM_FIELD_HELPER_CLASS, "text-neutral-600 dark:text-neutral-400")}
            role={intentTrimmedLength > 0 && !intentMeetsMinimum ? "alert" : "status"}
            data-testid="socratic-intent-helper"
          >
            {isCreateArchitectureFlow
              ? guidedIntakeCreationArchitectureOverviewHelperText(intentTrimmedLength)
              : guidedIntakeArchitectureIntentHelperText(intentTrimmedLength)}
          </p>
        </div>

        {isCreateArchitectureFlow ? (
          <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
            <IntakeFieldLabel
              htmlFor="socratic-outcome"
              label={GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL}
              required
            />
            <Textarea
              id="socratic-outcome"
              value={businessOutcome}
              onChange={(event) => setBusinessOutcome(event.target.value)}
              rows={2}
              disabled={busy}
              placeholder={GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER}
              data-testid="socratic-outcome"
              aria-invalid={outcomeTrimmedLength > 0 && !outcomeMeetsMinimum}
              aria-describedby="socratic-outcome-helper"
              aria-required
            />
            <p
              id="socratic-outcome-helper"
              className={cn(OPERATOR_FORM_FIELD_HELPER_CLASS, "text-neutral-600 dark:text-neutral-400")}
              role={outcomeTrimmedLength > 0 && !outcomeMeetsMinimum ? "alert" : "status"}
              data-testid="socratic-outcome-helper"
            >
              {outcomeTrimmedLength === 0
                ? GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_MIN_HELPER
                : outcomeMeetsMinimum
                  ? `${outcomeTrimmedLength} characters.`
                  : `${outcomeTrimmedLength} / ${MIN_OUTCOME_CHARS} characters. ${GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_MIN_HELPER}`}
            </p>
          </div>
        ) : (
          <>
            <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
              <IntakeFieldLabel htmlFor="socratic-system-name" label={GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL} required={false} />
              <Input
                id="socratic-system-name"
                value={systemName}
                onChange={(event) => setSystemName(event.target.value)}
                disabled={busy}
                data-testid="socratic-system-name"
              />
            </div>
            <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
              <IntakeFieldLabel htmlFor="socratic-outcome" label={GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL} required />
              <Textarea
                id="socratic-outcome"
                value={businessOutcome}
                onChange={(event) => setBusinessOutcome(event.target.value)}
                rows={2}
                disabled={busy}
                placeholder={GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER}
                data-testid="socratic-outcome"
                aria-required
              />
            </div>
          </>
        )}

        <DraftIntakeActorEditor
          actorSet={actorSet}
          intentText={freeTextIntent}
          disabled={busy}
          creationFlow={isCreateArchitectureFlow}
          onChange={setActorSet}
        />

        <ReviewAssuranceCoverageSection
          focusedPilotModeEnabled={focusedPilotModeEnabled}
          onFocusedPilotModeEnabledChange={setFocusedPilotModeEnabled}
          togglePresentation={isCreateArchitectureFlow ? "scope-card" : "checkbox"}
          className={isCreateArchitectureFlow ? "max-w-md" : undefined}
        />

        <ArchitectureScopeUnderstandingCheckPanel
          input={scopeUnderstandingInput}
          contextSourceLabel={`${intentFieldLabel} above`}
          showReadyHint={false}
          // Local editing only — an exhausted LLM budget must not lock the operator out of step 0.
          disabled={busy}
          onBulletsChange={setScopeBullets}
          onGateChange={setScopeGateOpen}
        />

        {!canAdvanceIntent && advanceHint.length > 0 ? (
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
            role="status"
            data-testid="socratic-advance-hint"
          >
            {advanceHint}
          </p>
        ) : null}

        {submitError !== null ? <GuidedIntakeRequestError error={submitError} /> : null}

        <Button
          type="button"
          disabled={!canAdvanceIntent}
          onClick={() => {
            if (isCreateArchitectureFlow) {
              void onCreateArchitectureContinuation();
              return;
            }

            void onAdmission();
          }}
          data-testid="socratic-admit"
        >
          {busy
            ? isCreateArchitectureFlow
              ? CREATE_ARCHITECTURE_STARTING_LABEL
              : "Checking readiness…"
            : isCreateArchitectureFlow
              ? GUIDED_INTAKE_CONTINUE_TO_DISCOVERY
              : GUIDED_INTAKE_CONTINUE_TO_CLARIFICATIONS}
        </Button>
      </CardContent>
    </Card>
  );
}
