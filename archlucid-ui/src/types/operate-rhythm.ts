/** Operate rhythm API DTOs (manual until UI codegen picks up OpenAPI). */

export type PilotFunnelSnapshotDto = {
  firstRunCreatedUtc?: string | null;
  firstGoldenManifestUtc?: string | null;
  firstComparisonUtc?: string | null;
  firstArtifactOrBundleDownloadUtc?: string | null;
  firstReplayUtc?: string | null;
  totalRunsInScope: number;
  committedRunsInScope: number;
  productLearningSignalsLast90Days: number;
};

export type OperatorStickinessSnapshotDto = {
  pilotFunnel: PilotFunnelSnapshotDto;
  latestRunId?: string | null;
  comparisonEventsLast30Days: number;
  pendingGovernanceApprovals: number;
};

export type ConnectorSurfaceStatusDto = {
  connectorKey: string;
  displayName: string;
  isConfigured: boolean;
  smokeReadiness: string;
  summary: string;
  configurationHref?: string | null;
};

export type IntegrationEventBusStatusDto = {
  publisherConfigured: boolean;
  transactionalOutboxEnabled: boolean;
  consumerConfigured: boolean;
  queueOrTopicName?: string | null;
  fullyQualifiedNamespace?: string | null;
  usesLegacyConnectionString: boolean;
  smokeReadiness: string;
};

export type TenantIntegrationsOperationsDto = {
  connectors: ConnectorSurfaceStatusDto[];
  integrationEventBus: IntegrationEventBusStatusDto;
};

export type WeeklyDigestHealthDto = {
  enabledAdvisoryScheduleCount: number;
  earliestNextAdvisoryRunUtc?: string | null;
  digestSubscriptionCount: number;
  enabledDigestSubscriptionCount: number;
  digestSubscriptionsByEmailChannel: number;
  digestSubscriptionsBySlackChannel: number;
  digestSubscriptionsByTeamsChannel: number;
  latestDigestSubscriptionDeliveryUtc?: string | null;
  latestArchitectureDigestId?: string | null;
  latestArchitectureDigestGeneratedUtc?: string | null;
  executiveEmailDigestIsConfigured: boolean;
  executiveEmailDigestEnabled: boolean;
  executiveDigestRecipientCount: number;
  executiveDigestIanaTimeZoneId: string;
  executiveDigestDayOfWeek: number;
  executiveDigestHourOfDay: number;
  setupGaps: string[];
};

export type AlertDeliveryAttemptDto = {
  channelType: string;
  status: string;
  attemptedUtc: string;
  destinationRedacted: string;
  errorMessage?: string | null;
};

export type AlertActionLoopDto = {
  alertId: string;
  status: string;
  runId?: string | null;
  lastUpdatedUtc?: string | null;
  resolutionComment?: string | null;
  deliveryAttempts: AlertDeliveryAttemptDto[];
};
