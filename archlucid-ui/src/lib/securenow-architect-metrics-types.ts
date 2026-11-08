export type SecureNowArchitectSupportingOperationalMetrics = {
  openFindings: number | null;
};

export type SecureNowArchitectOutcomeMetrics = {
  fromSnapshotId: string;
  toSnapshotId: string;
  ruleVersion: string;
  criticalOrHighConfidencePathsRemoved: number | null;
  privilegedIdentityNodesOnPathsReduced: number | null;
  unrestrictedEgressCapabilityPathsReduced: number | null;
  assertedCrownJewelExposurePathsRemoved: number | null;
  sharedControlBlastRadiusPathsRemoved: number | null;
  exceptionsExpired: number | null;
  remediationRecurrenceCount: number | null;
  supportingOperationalMetrics: SecureNowArchitectSupportingOperationalMetrics | null;
};
