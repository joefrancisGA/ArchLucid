export type TenantHomepageSettingsResponse = {
  selectedRunId: string | null;
  isConfigured: boolean;
  isAvailable: boolean;
  reviewTitle: string | null;
  architectureName: string | null;
  completedUtc: string | null;
  isSampleApproved: boolean;
};

export type FeaturedCompletedSampleCandidate = {
  runId: string;
  reviewTitle: string;
  architectureName: string;
  completedUtc: string;
  isSampleApproved: boolean;
};

export type TenantHomepageSettingsPutRequest = {
  selectedRunId: string | null;
};
