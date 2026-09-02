"use client";

import type { Dispatch, SetStateAction } from "react";

import { ArchitectureDraftStructuredBriefConfirmableChipList } from "@/components/architecture/ArchitectureDraftStructuredBriefConfirmableChipList";
import {
  addConfirmedListItem,
  confirmAllSuggestedListItems,
  confirmSuggestedListItem,
  denySuggestedListItem,
  removeConfirmedListItem,
  type StructuredBriefListFieldKey,
} from "@/components/architecture/structured-brief-list-mutations";
import type { StructuredBriefSuggestionsState } from "@/components/architecture/use-structured-brief-suggestions";
import { StructuredBriefCapabilitiesQualityVocabularyRail } from "@/components/StructuredBriefCapabilitiesQualityVocabularyRail";
import {
  joinQualityAttributeEntries,
  mergeUniqueStrings,
  parseQualityAttributeEntries,
  type ArchitectureDraftStructuredBriefState,
  type StructuredBriefSuggestedFieldKey,
} from "@/lib/architecture/architecture-draft-structured-brief";
import {
  GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_PLACEHOLDER,
  GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL,
} from "@/lib/guided-intake-copy";

export type ArchitectureDraftStructuredBriefListFieldsProps = {
  readonly brief: ArchitectureDraftStructuredBriefState;
  readonly disabled?: boolean;
  readonly suggestions: StructuredBriefSuggestionsState;
  readonly onStructuredBriefChange: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>;
  readonly onBriefConfirmOrDeny?: () => void;
};

export function ArchitectureDraftStructuredBriefListFields(
  props: ArchitectureDraftStructuredBriefListFieldsProps,
): React.JSX.Element {
  const { brief, suggestions } = props;

  const confirmSuggested = (
    confirmedKey: StructuredBriefListFieldKey,
    suggestedKey: StructuredBriefSuggestedFieldKey,
    value: string,
  ) => {
    confirmSuggestedListItem(props.onStructuredBriefChange, confirmedKey, suggestedKey, value);
    props.onBriefConfirmOrDeny?.();
  };

  const denySuggested = (suggestedKey: StructuredBriefSuggestedFieldKey, value: string) => {
    denySuggestedListItem(props.onStructuredBriefChange, suggestedKey, value);
    props.onBriefConfirmOrDeny?.();
  };

  return (
    <>
      <StructuredBriefCapabilitiesQualityVocabularyRail currentSurfaceId="architecture-draft-structured-brief" />

      <ArchitectureDraftStructuredBriefConfirmableChipList
        label="Constraints"
        hint="Hard limits the architecture must not violate — budget, regions, compliance. Leave empty if none are stated."
        inputId="architecture-draft-constraints"
        items={brief.confirmedConstraints}
        suggestedItems={brief.suggestedConstraints}
        suggestionKind="Constraint"
        suggestionSourceText={suggestions.failureModeSourceText}
        invalid={false}
        required={false}
        disabled={props.disabled === true}
        onAdd={(value) => {
          addConfirmedListItem(
            props.onStructuredBriefChange,
            "confirmedConstraints",
            "suggestedConstraints",
            value,
          );
          props.onBriefConfirmOrDeny?.();
        }}
        onRemove={(index) => {
          removeConfirmedListItem(props.onStructuredBriefChange, "confirmedConstraints", index);
        }}
        onConfirmSuggested={(value) => {
          confirmSuggested("confirmedConstraints", "suggestedConstraints", value);
        }}
        onDenySuggested={(value) => {
          denySuggested("suggestedConstraints", value);
        }}
        onConfirmAllSuggested={() => {
          confirmAllSuggestedListItems(
            props.onStructuredBriefChange,
            "confirmedConstraints",
            "suggestedConstraints",
            brief.suggestedConstraints,
          );
          props.onBriefConfirmOrDeny?.();
        }}
      />

      <ArchitectureDraftStructuredBriefConfirmableChipList
        label="Assumptions"
        hint="Facts agents may rely on unless evidence contradicts them. Leave empty if none are stated."
        inputId="architecture-draft-assumptions"
        items={brief.confirmedAssumptions}
        suggestedItems={brief.suggestedAssumptions}
        suggestionKind="Assumption"
        suggestionSourceText={suggestions.failureModeSourceText}
        invalid={false}
        required={false}
        disabled={props.disabled === true}
        onAdd={(value) => {
          addConfirmedListItem(
            props.onStructuredBriefChange,
            "confirmedAssumptions",
            "suggestedAssumptions",
            value,
          );
          props.onBriefConfirmOrDeny?.();
        }}
        onRemove={(index) => {
          removeConfirmedListItem(props.onStructuredBriefChange, "confirmedAssumptions", index);
          suggestions.setEvidenceContradictedAssumptions({});
        }}
        onConfirmSuggested={(value) => {
          confirmSuggested("confirmedAssumptions", "suggestedAssumptions", value);
        }}
        onDenySuggested={(value) => {
          denySuggested("suggestedAssumptions", value);
        }}
        onConfirmAllSuggested={() => {
          confirmAllSuggestedListItems(
            props.onStructuredBriefChange,
            "confirmedAssumptions",
            "suggestedAssumptions",
            brief.suggestedAssumptions,
          );
          props.onBriefConfirmOrDeny?.();
        }}
        evidenceContradictionNotes={suggestions.evidenceContradictedAssumptions}
      />

      <ArchitectureDraftStructuredBriefConfirmableChipList
        label={GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL}
        hint={GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_HINT}
        inputId="architecture-draft-capabilities"
        items={brief.confirmedRequiredCapabilities}
        suggestedItems={brief.suggestedRequiredCapabilities}
        suggestionKind="RequiredCapability"
        suggestionSourceText={suggestions.failureModeSourceText}
        invalid={false}
        required={false}
        disabled={props.disabled === true}
        onAdd={(value) => {
          addConfirmedListItem(
            props.onStructuredBriefChange,
            "confirmedRequiredCapabilities",
            "suggestedRequiredCapabilities",
            value,
          );
          props.onBriefConfirmOrDeny?.();
        }}
        onRemove={(index) => {
          removeConfirmedListItem(props.onStructuredBriefChange, "confirmedRequiredCapabilities", index);
        }}
        onConfirmSuggested={(value) => {
          confirmSuggested("confirmedRequiredCapabilities", "suggestedRequiredCapabilities", value);
        }}
        onDenySuggested={(value) => {
          denySuggested("suggestedRequiredCapabilities", value);
        }}
        onConfirmAllSuggested={() => {
          confirmAllSuggestedListItems(
            props.onStructuredBriefChange,
            "confirmedRequiredCapabilities",
            "suggestedRequiredCapabilities",
            brief.suggestedRequiredCapabilities,
          );
          props.onBriefConfirmOrDeny?.();
        }}
      />

      <ArchitectureDraftStructuredBriefConfirmableChipList
        label={GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_LABEL}
        hint={GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_HINT}
        inputId="architecture-draft-quality-attributes"
        inputPlaceholder={GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_PLACEHOLDER}
        items={parseQualityAttributeEntries(brief.qualityAttribute)}
        suggestedItems={[]}
        invalid={false}
        required={false}
        emptyMessage="No quality attributes yet."
        disabled={props.disabled === true}
        helpSlug="structured-brief"
        helpHashFragment="field-concepts"
        helpLabel="Read quality attributes help"
        onAdd={(value) => {
          props.onStructuredBriefChange((current) => ({
            ...current,
            qualityAttribute: joinQualityAttributeEntries(
              mergeUniqueStrings(parseQualityAttributeEntries(current.qualityAttribute), [value]),
            ),
          }));
        }}
        onRemove={(index) => {
          props.onStructuredBriefChange((current) => ({
            ...current,
            qualityAttribute: joinQualityAttributeEntries(
              parseQualityAttributeEntries(current.qualityAttribute).filter(
                (_, itemIndex) => itemIndex !== index,
              ),
            ),
          }));
        }}
        onConfirmSuggested={() => undefined}
        onDenySuggested={() => undefined}
      />
    </>
  );
}
