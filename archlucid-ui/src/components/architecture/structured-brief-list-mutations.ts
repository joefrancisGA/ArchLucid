import type { Dispatch, SetStateAction } from "react";

import {
  denyStructuredBriefSuggestion,
  mergeExclusiveConfirmedItem,
  type ArchitectureDraftStructuredBriefState,
  type StructuredBriefSuggestedFieldKey,
} from "@/lib/architecture/architecture-draft-structured-brief";

export type StructuredBriefListFieldKey =
  | "confirmedConstraints"
  | "confirmedAssumptions"
  | "confirmedRequiredCapabilities";

export function addConfirmedListItem(
  onStructuredBriefChange: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>,
  confirmedKey: StructuredBriefListFieldKey,
  suggestedKey: StructuredBriefSuggestedFieldKey,
  value: string,
): void {
  onStructuredBriefChange((current) => ({
    ...current,
    [confirmedKey]: mergeExclusiveConfirmedItem(current[confirmedKey], value),
    [suggestedKey]: current[suggestedKey].filter((item) => item !== value),
  }));
}

export function removeConfirmedListItem(
  onStructuredBriefChange: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>,
  confirmedKey: StructuredBriefListFieldKey,
  index: number,
): void {
  onStructuredBriefChange((current) => ({
    ...current,
    [confirmedKey]: current[confirmedKey].filter((_, itemIndex) => itemIndex !== index),
  }));
}

export function confirmSuggestedListItem(
  onStructuredBriefChange: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>,
  confirmedKey: StructuredBriefListFieldKey,
  suggestedKey: StructuredBriefSuggestedFieldKey,
  value: string,
): void {
  onStructuredBriefChange((current) => ({
    ...current,
    [confirmedKey]: mergeExclusiveConfirmedItem(current[confirmedKey], value),
    [suggestedKey]: current[suggestedKey].filter((item) => item !== value),
  }));
}

export function denySuggestedListItem(
  onStructuredBriefChange: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>,
  suggestedKey: StructuredBriefSuggestedFieldKey,
  value: string,
): void {
  onStructuredBriefChange((current) => denyStructuredBriefSuggestion(current, suggestedKey, value));
}

export function confirmAllSuggestedListItems(
  onStructuredBriefChange: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>,
  confirmedKey: StructuredBriefListFieldKey,
  suggestedKey: StructuredBriefSuggestedFieldKey,
  suggestedItems: readonly string[],
): void {
  if (suggestedItems.length === 0) {
    return;
  }

  onStructuredBriefChange((current) => {
    let confirmedItems = [...current[confirmedKey]];

    for (const item of suggestedItems) {
      confirmedItems = mergeExclusiveConfirmedItem(confirmedItems, item);
    }

    return {
      ...current,
      [confirmedKey]: confirmedItems,
      [suggestedKey]: [],
    };
  });
}
