export type AlertRoutingSubscription = {
  routingSubscriptionId: string;
  tenantId: string;
  workspaceId: string;
  projectId: string;
  name: string;
  channelType: string;
  destination: string;
  minimumSeverity: string;
  isEnabled: boolean;
  createdUtc: string;
  lastDeliveredUtc?: string | null;
  metadataJson: string;
};

export type AlertRoutingDeliveryAttempt = {
  alertDeliveryAttemptId: string;
  alertId: string;
  routingSubscriptionId: string;
  attemptedUtc: string;
  status: string;
  errorMessage?: string | null;
  channelType: string;
  destination: string;
  retryCount: number;
};
