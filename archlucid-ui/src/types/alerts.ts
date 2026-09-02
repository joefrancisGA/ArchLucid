import type { components } from "@/lib/openapi-schemas";

type AlertRuleSchema = components["schemas"]["AlertRule"];

/** Alert rule row — OpenAPI `AlertRule` with required primitives for operator tables. */
export type AlertRule = Omit<
  AlertRuleSchema &
    Required<
      Pick<
        AlertRuleSchema,
        | "ruleId"
        | "tenantId"
        | "workspaceId"
        | "projectId"
        | "name"
        | "ruleType"
        | "severity"
        | "isEnabled"
        | "targetChannelType"
        | "metadataJson"
        | "createdUtc"
      >
    >,
  "thresholdValue"
> & {
  thresholdValue: number;
};

type AlertRecordSchema = components["schemas"]["AlertRecord"];

/** Fired alert inbox row — OpenAPI `AlertRecord` plus demo deep-link enrichment. */
export type AlertRecord = AlertRecordSchema &
  Required<
    Pick<
      AlertRecordSchema,
      | "alertId"
      | "ruleId"
      | "title"
      | "category"
      | "severity"
      | "status"
      | "triggerValue"
      | "description"
      | "createdUtc"
    >
  > & {
    /** When set, inbox surfaces can deep-link to structured finding detail (demo PHI alert). */
    primaryFindingId?: string | null;
  };
