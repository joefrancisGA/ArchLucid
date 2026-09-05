export type PreferencesSaveChecklistStepStatus = "default" | "done" | "pending";

export type PreferencesSaveChecklistStep = {
  readonly id: string;
  readonly label: string;
  readonly anchorId?: string;
  readonly status: PreferencesSaveChecklistStepStatus;
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
  readonly workspaceMode: PreferenceSaveStepInput;
}): readonly PreferencesSaveChecklistStep[] {
  return [
    {
      id: "workspace-mode",
      label: "Workspace mode",
      anchorId: "workspace-mode",
      status: resolvePreferenceStepStatus(input.workspaceMode),
    },
    {
      id: "appearance",
      label: "Choose appearance theme",
      status: resolvePreferenceStepStatus(input.appearance),
    },
    {
      id: "time-zone",
      label: "Choose time zone",
      status: resolvePreferenceStepStatus(input.timeZone),
    },
    {
      id: "cloud-platforms",
      label: "Choose cloud platform scope",
      status: resolvePreferenceStepStatus(input.cloudPlatforms),
    },
    {
      id: "sample-reviews-on-overview",
      label: "Choose sample reviews on Home",
      status: resolvePreferenceStepStatus(input.sampleReviewsOnOverview),
    },
    {
      id: "follow-up-link-strips",
      label: "Choose follow-up link strips",
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
