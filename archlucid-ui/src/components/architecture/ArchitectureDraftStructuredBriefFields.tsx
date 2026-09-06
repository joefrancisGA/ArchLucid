"use client";

import type { Dispatch, SetStateAction } from "react";

import { ArchitectureDraftStructuredBriefFailureModeField } from "@/components/architecture/ArchitectureDraftStructuredBriefFailureModeField";
import { ArchitectureDraftStructuredBriefListFields } from "@/components/architecture/ArchitectureDraftStructuredBriefListFields";
import { ArchitectureDraftStructuredBriefSuggestRail } from "@/components/architecture/ArchitectureDraftStructuredBriefSuggestRail";
import { useStructuredBriefSuggestions } from "@/components/architecture/use-structured-brief-suggestions";
import { IntakeTextField } from "@/components/intake/IntakeTextField";
import type { ArchitectureDraftStructuredBriefState } from "@/lib/architecture/architecture-draft-structured-brief";
import {
  GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_PLACEHOLDER,
} from "@/lib/guided-intake-copy";

type ArchitectureDraftStructuredBriefFieldsProps = {
  readonly structuredBrief: ArchitectureDraftStructuredBriefState;
  readonly freeTextIntent: string;
  readonly systemName?: string;
  readonly businessOutcome?: string;
  readonly disabled?: boolean;
  readonly blocksLlmExecution?: boolean;
  readonly markReviewReadinessInvalid?: boolean;
  readonly onStructuredBriefChange: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>;
  readonly onBriefConfirmOrDeny?: () => void;
  readonly draftId?: string;
  readonly suggestFromOverviewNonce?: number;
};

/** Structured brief lists and quality notes for architecture draft review readiness (TB-2282). */
export function ArchitectureDraftStructuredBriefFields(
  props: ArchitectureDraftStructuredBriefFieldsProps,
): React.JSX.Element {
  const brief = props.structuredBrief;

  const suggestions = useStructuredBriefSuggestions({
    structuredBrief: brief,
    freeTextIntent: props.freeTextIntent,
    systemName: props.systemName,
    businessOutcome: props.businessOutcome,
    disabled: props.disabled,
    blocksLlmExecution: props.blocksLlmExecution,
    draftId: props.draftId,
    suggestFromOverviewNonce: props.suggestFromOverviewNonce,
    onStructuredBriefChange: (nextBrief) => {
      props.onStructuredBriefChange(nextBrief);
    },
  });

  const updateBrief = (partial: Partial<ArchitectureDraftStructuredBriefState>) => {
    props.onStructuredBriefChange((current) => ({ ...current, ...partial }));
  };

  return (
    <div
      id="architecture-draft-structured-brief-fields"
      className="space-y-6"
      data-testid="architecture-draft-structured-brief-fields"
    >
      <ArchitectureDraftStructuredBriefSuggestRail
        suggestions={suggestions}
        disabled={props.disabled}
        blocksLlmExecution={props.blocksLlmExecution}
      />

      <ArchitectureDraftStructuredBriefListFields
        brief={brief}
        disabled={props.disabled}
        suggestions={suggestions}
        onStructuredBriefChange={props.onStructuredBriefChange}
        onBriefConfirmOrDeny={props.onBriefConfirmOrDeny}
      />

      <ArchitectureDraftStructuredBriefFailureModeField
        brief={brief}
        disabled={props.disabled}
        onStructuredBriefChange={props.onStructuredBriefChange}
        onBriefConfirmOrDeny={props.onBriefConfirmOrDeny}
      />

      <IntakeTextField
        id="architecture-draft-operational-owner"
        label={GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_LABEL}
        hint={GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_HINT}
        required={false}
        showRequirednessSuffix={false}
        value={brief.operationalOwner}
        placeholder={GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_PLACEHOLDER}
        disabled={props.disabled === true}
        testId="architecture-draft-operational-owner"
        onChange={(value) => {
          updateBrief({ operationalOwner: value });
        }}
      />
    </div>
  );
}
