"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { cn } from "@/lib/utils";

import { ArchitectureDraftOverviewRewritePanel } from "@/components/architecture/ArchitectureDraftOverviewRewritePanel";
import { DraftIntakeActorEditor } from "@/components/draft-intake/DraftIntakeActorEditor";
import { WorkspaceSystemNameAvailabilityFeedback } from "@/components/intake/WorkspaceSystemNameAvailabilityFeedback";
import { IntakeFieldLabel } from "@/components/intake/IntakeFieldLabel";
import { Input } from "@/components/ui/input";
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
import { useWorkspaceSystemNameAvailability } from "@/hooks/use-workspace-system-name-availability";
import type { ActorSet } from "@/types/draft-intake";

const MIN_OUTCOME_CHARS = 10;

type ArchitectureDraftFormFieldsProps = {
  readonly fields: ArchitectureDraftFieldState;
  readonly actorSet: ActorSet;
  readonly disabled?: boolean;
  readonly blocksLlmExecution?: boolean;
  /** When true, mark required fields that fail review-start minimums (TB-2006). */
  readonly markReviewReadinessInvalid?: boolean;
  readonly onFieldsChange: Dispatch<SetStateAction<ArchitectureDraftFieldState>>;
  readonly onActorSetChange: (actorSet: ActorSet) => void;
  readonly actorSuggestionGateRequestId?: number;
  readonly draftId?: string;
  readonly onActorSuggestionsUnresolvedChange?: (unresolved: boolean) => void;
};

/** Fixed starting architecture questions for draft editing. */
export function ArchitectureDraftFormFields(props: ArchitectureDraftFormFieldsProps): React.JSX.Element {
  const [briefConfirmOrDenyCount, setBriefConfirmOrDenyCount] = useState(0);
  const [suggestFromOverviewNonce, setSuggestFromOverviewNonce] = useState(0);
  const intentTrimmedLength = props.fields.freeTextIntent.trim().length;
  const outcomeTrimmedLength = props.fields.businessOutcome.trim().length;
  const outcomeMeetsMinimum = outcomeTrimmedLength >= MIN_OUTCOME_CHARS;
  const markInvalid = props.markReviewReadinessInvalid === true;
  const systemNameInvalid = markInvalid && props.fields.systemName.trim().length === 0;
  const systemNameAvailability = useWorkspaceSystemNameAvailability({
    systemName: props.fields.systemName,
    occupancyKind: "architecture",
    excludeDraftId: props.draftId ?? null,
    enabled: props.disabled !== true,
    minTrimmedLength: 1,
  });
  const systemNameConflict =
    systemNameAvailability.validationReady &&
    !systemNameAvailability.isAvailable &&
    systemNameAvailability.conflictMessage !== null;
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
            props.onFieldsChange((fields) => ({ ...fields, systemName: event.target.value }));
          }}
          disabled={props.disabled === true}
          placeholder={GUIDED_INTAKE_CREATION_SYSTEM_NAME_PLACEHOLDER}
          data-testid="architecture-draft-system-name"
          aria-required
          aria-invalid={systemNameInvalid || systemNameConflict}
        />
        <WorkspaceSystemNameAvailabilityFeedback
          availability={systemNameAvailability}
          occupancyKind="architecture"
          testId="architecture-draft-system-name-availability"
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
            props.onFieldsChange((fields) => ({ ...fields, freeTextIntent: event.target.value }));
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
        <ArchitectureDraftOverviewRewritePanel
          currentOverview={props.fields.freeTextIntent}
          systemName={props.fields.systemName}
          businessOutcome={props.fields.businessOutcome}
          structuredBrief={props.fields.structuredBrief}
          disabled={props.disabled === true}
          blocksLlmExecution={props.blocksLlmExecution === true}
          onOverviewAccepted={(rewrittenOverview) => {
            props.onFieldsChange((fields) => ({ ...fields, freeTextIntent: rewrittenOverview }));
          }}
          onRequestResuggestFromOverview={() => {
            setSuggestFromOverviewNonce((current) => current + 1);
          }}
        />
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
            props.onFieldsChange((fields) => ({ ...fields, businessOutcome: event.target.value }));
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
        suggestionGateRequestId={props.actorSuggestionGateRequestId}
        onUnresolvedSuggestionsChange={props.onActorSuggestionsUnresolvedChange}
        onChange={props.onActorSetChange}
      />

      <ArchitectureDraftStructuredBriefFields
        structuredBrief={props.fields.structuredBrief}
        freeTextIntent={props.fields.freeTextIntent}
        systemName={props.fields.systemName}
        businessOutcome={props.fields.businessOutcome}
        disabled={props.disabled === true}
        blocksLlmExecution={props.blocksLlmExecution === true}
        architectureId={props.draftId}
        markReviewReadinessInvalid={markInvalid}
        onBriefConfirmOrDeny={() => {
          setBriefConfirmOrDenyCount((current) => current + 1);
        }}
        suggestFromOverviewNonce={suggestFromOverviewNonce}
        onStructuredBriefChange={(updater) => {
          props.onFieldsChange((fields) => ({
            ...fields,
            structuredBrief:
              typeof updater === "function" ? updater(fields.structuredBrief) : updater,
          }));
        }}
      />
    </div>
  );
}
