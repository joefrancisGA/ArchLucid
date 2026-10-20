/** Mirrors ArchLucid.Core.AzureExtractor.AzureInventoryRelationshipCompletenessWarningCodes (UI subset). */

export const AzureInventoryRelationshipCompletenessWarningCodes = {
  AppSettingsNotCollectedHostedGetOnly: "app-settings-not-collected-hosted-get-only",
  AppSettingsListForbiddenPrefix: "app-settings-list-forbidden:",
  AppSettingsHostUnresolved: "app-settings-host-unresolved",
  AksWorkloadImagesNotCollectedCustomerScript:
    "aks-workload-images-not-collected-customer-script",
  AksWorkloadImagesNotCollectedHosted: "aks-workload-images-not-collected-hosted",
  LogicAppConnectionsNotCollected: "logic-app-connections-not-collected",
  LogicAppConnectionsMissing: "logic-app-connections-missing",
  FabricCapacityAssignmentsNotCollected: "fabric-capacity-assignments-not-collected",
  FabricCapacityWorkspacesOutsideInventory: "fabric-capacity-workspaces-outside-inventory",
  StaticSiteBackendsNotCollected: "static-site-backends-not-collected",
} as const;

export const AzureInventoryCollectionWarningReasons = {
  InsufficientPermission: "insufficient-permission",
  HttpError: "http-error",
  Error: "error",
} as const;

export const AzureInventoryAksWorkloadImageCollectionWarningReasons = {
  InsufficientRbac: "insufficient-rbac",
  MissingLogs: "missing-logs",
  RunCommandFailed: "run-command-failed",
  HttpError: "http-error",
  PollTimeout: "poll-timeout",
  Unavailable: "unavailable",
  Error: "error",
} as const;
