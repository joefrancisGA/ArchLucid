import type { components } from "@/lib/openapi-schemas";

type WeeklyDigestHealthResponseSchema = components["schemas"]["WeeklyDigestHealthResponse"];

export type WeeklyDigestHealthDto = WeeklyDigestHealthResponseSchema &
  Required<
    Pick<
      WeeklyDigestHealthResponseSchema,
      | "enabledAdvisoryScheduleCount"
      | "digestSubscriptionCount"
      | "enabledDigestSubscriptionCount"
      | "digestSubscriptionsByEmailChannel"
      | "digestSubscriptionsBySlackChannel"
      | "digestSubscriptionsByTeamsChannel"
      | "executiveEmailDigestIsConfigured"
      | "executiveEmailDigestEnabled"
      | "executiveDigestRecipientCount"
      | "executiveDigestIanaTimeZoneId"
      | "executiveDigestDayOfWeek"
      | "executiveDigestHourOfDay"
      | "setupGaps"
    >
  > & {
    setupGapCodes?: string[];
  };

type AlertDeliveryAttemptResponseSchema = components["schemas"]["AlertDeliveryAttemptResponse"];

export type AlertDeliveryAttemptDto = AlertDeliveryAttemptResponseSchema &
  Required<
    Pick<AlertDeliveryAttemptResponseSchema, "channelType" | "status" | "attemptedUtc" | "destinationRedacted">
  >;

type AlertActionLoopResponseSchema = components["schemas"]["AlertActionLoopResponse"];

export type AlertActionLoopDto = AlertActionLoopResponseSchema &
  Required<Pick<AlertActionLoopResponseSchema, "alertId" | "status" | "deliveryAttempts">> & {
    deliveryAttempts: AlertDeliveryAttemptDto[];
  };
