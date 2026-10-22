import type { components } from "@/lib/openapi-schemas";

type AlertRuleConditionSchema = components["schemas"]["AlertRuleCondition"];

export type CompositeAlertRuleCondition = Omit<
  AlertRuleConditionSchema & Required<Pick<AlertRuleConditionSchema, "metricType" | "operator">>,
  "thresholdValue"
> & {
  conditionId?: string;
  thresholdValue: string | number;
};

type CompositeAlertRuleSchema = components["schemas"]["CompositeAlertRule"];

export type CompositeAlertRule = CompositeAlertRuleSchema &
  Required<
    Pick<
      CompositeAlertRuleSchema,
      | "compositeRuleId"
      | "tenantId"
      | "workspaceId"
      | "projectId"
      | "name"
      | "severity"
      | "operator"
      | "isEnabled"
      | "suppressionWindowMinutes"
      | "cooldownMinutes"
      | "reopenDeltaThreshold"
      | "dedupeScope"
      | "targetChannelType"
      | "createdUtc"
      | "conditions"
    >
  >;
