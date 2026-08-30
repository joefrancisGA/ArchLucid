export type AzureBoardsConnectionTestGate = {
  readonly allowed: boolean;
  readonly reason: string | null;
};

export type AzureBoardsPageCompositionBlockedReason = "feature-off" | "load-error";

export type AzureBoardsPageComposition = {
  readonly blocked: boolean;
  readonly blockedReason: AzureBoardsPageCompositionBlockedReason | null;
  readonly showConnectionSettings: boolean;
  readonly defaultBehaviorCollapsed: boolean;
  readonly showConnectionTest: boolean;
  readonly connectionTestCollapsed: boolean;
  readonly saveSettingsVariant: "default" | "outline";
  readonly emphasizedSetupStepId: string;
};

export function resolveAzureBoardsConnectionTestGate(input: {
  readonly nativeEnabled: boolean;
  readonly credentialsReady: boolean;
  readonly settingsReady: boolean;
  readonly isTesting: boolean;
  readonly isSaving: boolean;
}): AzureBoardsConnectionTestGate {
  if (!input.nativeEnabled) {
    return { allowed: false, reason: "Work management integrations are not enabled for this deployment." };
  }

  if (!input.credentialsReady) {
    return { allowed: false, reason: "Complete credential setup before testing." };
  }

  if (!input.settingsReady) {
    return { allowed: false, reason: "Save a default project and work item type before testing." };
  }

  if (input.isTesting) {
    return { allowed: false, reason: null };
  }

  if (input.isSaving) {
    return { allowed: false, reason: "Wait for settings to finish saving." };
  }

  return { allowed: true, reason: null };
}

/** Progressive disclosure for Azure Boards integration page (TB-1154 / TB-1155). */
export function resolveAzureBoardsPageComposition(input: {
  readonly nativeEnabled: boolean;
  readonly itsmHealthLoadFailed: boolean;
  readonly credentialsReady: boolean;
  readonly settingsReady: boolean;
  readonly testGateAllowed: boolean;
  readonly connectionSliceFailed: boolean;
  readonly hasConnectionPayload: boolean;
}): AzureBoardsPageComposition {
  const featureBlocked = input.itsmHealthLoadFailed || !input.nativeEnabled;
  const configurationBlocked =
    featureBlocked ||
    (input.connectionSliceFailed && !input.hasConnectionPayload && !input.credentialsReady);

  if (configurationBlocked) {
    return {
      blocked: true,
      blockedReason: featureBlocked ? "feature-off" : "load-error",
      showConnectionSettings: false,
      defaultBehaviorCollapsed: true,
      showConnectionTest: false,
      connectionTestCollapsed: false,
      saveSettingsVariant: "outline",
      emphasizedSetupStepId: "credentials",
    };
  }

  if (!input.credentialsReady) {
    return {
      blocked: false,
      blockedReason: null,
      showConnectionSettings: true,
      defaultBehaviorCollapsed: true,
      showConnectionTest: false,
      connectionTestCollapsed: true,
      saveSettingsVariant: "outline",
      emphasizedSetupStepId: "credentials",
    };
  }

  if (!input.settingsReady) {
    return {
      blocked: false,
      blockedReason: null,
      showConnectionSettings: true,
      defaultBehaviorCollapsed: false,
      showConnectionTest: false,
      connectionTestCollapsed: true,
      saveSettingsVariant: "default",
      emphasizedSetupStepId: "defaults",
    };
  }

  if (!input.testGateAllowed) {
    return {
      blocked: false,
      blockedReason: null,
      showConnectionSettings: true,
      defaultBehaviorCollapsed: false,
      showConnectionTest: false,
      connectionTestCollapsed: true,
      saveSettingsVariant: "default",
      emphasizedSetupStepId: "verify",
    };
  }

  return {
    blocked: false,
    blockedReason: null,
    showConnectionSettings: true,
    defaultBehaviorCollapsed: false,
    showConnectionTest: true,
    connectionTestCollapsed: false,
    saveSettingsVariant: "default",
    emphasizedSetupStepId: input.testGateAllowed ? "verify" : "create",
  };
}
