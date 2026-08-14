"use client";

import { cn } from "@/lib/utils";

import { DraftIntakeActorEditor } from "@/components/draft-intake/DraftIntakeActorEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { ArchitectureDraftStructuredBriefFields } from "@/components/architecture/ArchitectureDraftStructuredBriefFields";
import { ARCHITECTURE_DRAFT_ALTERNATIVES_HINT } from "@/lib/create-vs-review-intake-copy";
import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS,
  GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER,
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL,
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER,
  GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL,
  GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_MIN_HELPER,
  GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL,
  GUIDED_INTAKE_CREATION_SYSTEM_NAME_PLACEHOLDER,
  guidedIntakeCreationArchitectureOverviewHelperText,
} from "@/lib/guided-intake-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ActorSet } from "@/types/draft-intake";

const MIN_OUTCOME_CHARS = 10;

type ArchitectureDraftFormFieldsProps = {
  readonly fields: ArchitectureDraftFieldState;
  readonly actorSet: ActorSet;
  readonly disabled?: boolean;
  /** When true, mark required fields that fail review-start minimums (TB-2006). */
  readonly markReviewReadinessInvalid?: boolean;
  readonly onFieldsChange: (fields: ArchitectureDraftFieldState) => void;
  readonly onActorSetChange: (actorSet: ActorSet) => void;
};

function IntakeFieldLabel(props: {
  readonly htmlFor: string;
  readonly label: string;
  readonly required: boolean;
}): React.JSX.Element {
  return (
    <Label htmlFor={props.htmlFor} className="font-semibold text-neutral-900 dark:text-neutral-100">
      {props.label}
      <span className={cn("font-normal text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {props.required ? " (required)" : " (optional)"}
      </span>
    </Label>
  );
}

/** Fixed starting architecture questions for draft editing. */
export function ArchitectureDraftFormFields(props: ArchitectureDraftFormFieldsProps): React.JSX.Element {
  const intentTrimmedLength = props.fields.freeTextIntent.trim().length;
  const outcomeTrimmedLength = props.fields.businessOutcome.trim().length;
  const outcomeMeetsMinimum = outcomeTrimmedLength >= MIN_OUTCOME_CHARS;
  const markInvalid = props.markReviewReadinessInvalid === true;
  const systemNameInvalid = markInvalid && props.fields.systemName.trim().length === 0;
  const overviewInvalid = markInvalid && intentTrimmedLength < GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS;
  const outcomeInvalid = markInvalid && outcomeTrimmedLength < MIN_OUTCOME_CHARS;

  return (
    <div className="space-y-6" data-testid="architecture-draft-form-fields">
      <div className="space-y-2">
        <IntakeFieldLabel
          htmlFor="architecture-draft-system-name"
          label={GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL}
          required
        />
        <Input
          id="architecture-draft-system-name"
          value={props.fields.systemName}
          onChange={(event) => {
            props.onFieldsChange({ ...props.fields, systemName: event.target.value });
          }}
          disabled={props.disabled === true}
          placeholder={GUIDED_INTAKE_CREATION_SYSTEM_NAME_PLACEHOLDER}
          data-testid="architecture-draft-system-name"
          aria-required
          aria-invalid={systemNameInvalid}
        />
      </div>

      <div className="space-y-2">
        <IntakeFieldLabel
          htmlFor="architecture-draft-intent"
          label={GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL}
          required
        />
        <Textarea
          id="architecture-draft-intent"
          value={props.fields.freeTextIntent}
          onChange={(event) => {
            props.onFieldsChange({ ...props.fields, freeTextIntent: event.target.value });
          }}
          rows={4}
          disabled={props.disabled === true}
          placeholder={GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER}
          data-testid="architecture-draft-intent"
          aria-required
          aria-invalid={overviewInvalid}
        />
        <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
          {guidedIntakeCreationArchitectureOverviewHelperText(intentTrimmedLength)}
        </p>
        <p
          className={cn(OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
          data-testid="architecture-draft-intent-alternatives-hint"
        >
          {ARCHITECTURE_DRAFT_ALTERNATIVES_HINT}
        </p>
      </div>

      <div className="space-y-2">
        <IntakeFieldLabel
          htmlFor="architecture-draft-outcome"
          label={GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL}
          required
        />
        <Textarea
          id="architecture-draft-outcome"
          value={props.fields.businessOutcome}
          onChange={(event) => {
            props.onFieldsChange({ ...props.fields, businessOutcome: event.target.value });
          }}
          rows={2}
          disabled={props.disabled === true}
          placeholder={GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER}
          data-testid="architecture-draft-outcome"
          aria-required
          aria-invalid={outcomeInvalid}
        />
        <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
          {outcomeTrimmedLength === 0
            ? GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_MIN_HELPER
            : outcomeMeetsMinimum
              ? `${outcomeTrimmedLength} characters.`
              : `${outcomeTrimmedLength} / ${MIN_OUTCOME_CHARS} characters. ${GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_MIN_HELPER}`}
        </p>
      </div>

      <DraftIntakeActorEditor
        actorSet={props.actorSet}
        intentText={props.fields.freeTextIntent}
        disabled={props.disabled === true}
        creationFlow
        onChange={props.onActorSetChange}
      />

      <ArchitectureDraftStructuredBriefFields
        structuredBrief={props.fields.structuredBrief}
        freeTextIntent={props.fields.freeTextIntent}
        disabled={props.disabled === true}
        markReviewReadinessInvalid={markInvalid}
        onStructuredBriefChange={(structuredBrief) => {
          props.onFieldsChange({ ...props.fields, structuredBrief });
        }}
      />
    </div>
  );
}
