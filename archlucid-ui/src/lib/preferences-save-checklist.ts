export type PreferencesSaveChecklistStepStatus = "default" | "done" | "pending";

export type PreferencesSaveChecklistStep = {
  readonly id: string;
  readonly label: string;
  readonly status: PreferencesSaveChecklistStepStatus;
  readonly anchorId: string;
};

export type PreferenceSaveStepInput = {
  readonly isExplicit: boolean;
  readonly mounted: boolean;
  readonly accountSyncState: "idle" | "synced" | "local-only";
};

function resolvePreferenceStepStatus(input: PreferenceSaveStepInput): PreferencesSaveChecklistStepStatus {
  if (!input.isExplicit) {
    return "default";
  }

  if (!input.mounted) {
    return "pending";
  }

  if (input.accountSyncState === "synced") {
    return "done";
  }

  return "pending";
}

export function resolvePreferencesSaveSteps(input: {
  readonly appearance: PreferenceSaveStepInput;
  readonly timeZone: PreferenceSaveStepInput;
  readonly cloudPlatforms: PreferenceSaveStepInput;
  readonly sampleReviewsOnOverview: PreferenceSaveStepInput;
  readonly followUpLinkStrips: PreferenceSaveStepInput;
}): readonly PreferencesSaveChecklistStep[] {
  return [
    {
      id: "appearance",
      label: "Appearance",
      anchorId: "appearance",
      status: resolvePreferenceStepStatus(input.appearance),
    },
    {
      id: "time-zone",
      label: "Time zone",
      anchorId: "time-zone",
      status: resolvePreferenceStepStatus(input.timeZone),
    },
    {
      id: "cloud-platforms",
      label: "Cloud platforms shown",
      anchorId: "cloud-platforms-shown",
      status: resolvePreferenceStepStatus(input.cloudPlatforms),
    },
    {
      id: "sample-reviews-on-overview",
      label: "Sample reviews on Overview",
      anchorId: "sample-reviews-on-overview",
      status: resolvePreferenceStepStatus(input.sampleReviewsOnOverview),
    },
    {
      id: "follow-up-link-strips",
      label: "Follow-up link strips",
      anchorId: "follow-up-link-strips",
      status: resolvePreferenceStepStatus(input.followUpLinkStrips),
    },
  ];
}

export function resolvePreferencesSaveEmphasizedStepId(
  steps: readonly PreferencesSaveChecklistStep[],
): string {
  const needsAttention = steps.find((step) => step.status === "default" || step.status === "pending");

  return needsAttention?.id ?? steps[steps.length - 1]?.id ?? "appearance";
}
