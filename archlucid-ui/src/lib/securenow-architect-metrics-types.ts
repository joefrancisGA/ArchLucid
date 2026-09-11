export type SecureNowArchitectSupportingOperationalMetrics = {
  openFindings: number;
};

export type SecureNowArchitectOutcomeMetrics = {
  fromSnapshotId: string;
  toSnapshotId: string;
  ruleVersion: string;
  criticalOrHighConfidencePathsRemoved: number;
  privilegedIdentityNodesOnPathsReduced: number;
  unrestrictedEgressCapabilityPathsReduced: number;
  assertedCrownJewelExposurePathsRemoved: number;
  sharedControlBlastRadiusPathsRemoved: number;
  exceptionsExpired: number;
  remediationRecurrenceCount: number;
  supportingOperationalMetrics: SecureNowArchitectSupportingOperationalMetrics | null;
};
