import type { components } from "@/lib/openapi-schemas";

type DigestSubscriptionSchema = components["schemas"]["DigestSubscription"];

/** A subscription that delivers architecture digests via a channel (email, webhook, etc.). */
export type DigestSubscription = DigestSubscriptionSchema &
  Required<
    Pick<
      DigestSubscriptionSchema,
      | "subscriptionId"
      | "tenantId"
      | "workspaceId"
      | "projectId"
      | "name"
      | "channelType"
      | "destination"
      | "isEnabled"
      | "createdUtc"
      | "metadataJson"
    >
  >;

type DigestDeliveryAttemptSchema = components["schemas"]["DigestDeliveryAttempt"];

/** Record of a single attempt to deliver a digest to a subscription channel. */
export type DigestDeliveryAttempt = DigestDeliveryAttemptSchema &
  Required<
    Pick<
      DigestDeliveryAttemptSchema,
      | "attemptId"
      | "digestId"
      | "subscriptionId"
      | "attemptedUtc"
      | "status"
      | "channelType"
      | "destination"
    >
  >;
