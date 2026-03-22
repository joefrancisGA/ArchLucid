export type CompositeAlertRuleCondition = {
  conditionId?: string;
  metricType: string;
  operator: string;
  thresholdValue: number;
};

export type CompositeAlertRule = {
  compositeRuleId: string;
  tenantId: string;
  workspaceId: string;
  projectId: string;
  name: string;
  severity: string;
  operator: string;
  isEnabled: boolean;
  suppressionWindowMinutes: number;
  cooldownMinutes: number;
  reopenDeltaThreshold: number;
  dedupeScope: string;
  targetChannelType: string;
  createdUtc: string;
  conditions: CompositeAlertRuleCondition[];
};
