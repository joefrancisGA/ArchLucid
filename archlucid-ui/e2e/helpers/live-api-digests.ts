/** Digest subscription routes (`/v1/digest-subscriptions`). */
import type { APIRequestContext } from "@playwright/test";

import { resolveLiveApiBase } from "./live-api-auth";
import { liveAcceptHeaders, liveJsonHeaders } from "./live-api-headers";
import { throwIfNotOk } from "./live-api-response";

export type DigestSubscriptionJson = {
  subscriptionId?: string;
  name?: string;
  channelType?: string;
  destination?: string;
  isEnabled?: boolean;
};

/** POST `/v1/digest-subscriptions` — create digest route (ExecuteAuthority). */
export async function createDigestSubscription(
  request: APIRequestContext,
  body: { name: string; channelType: string; destination: string; isEnabled?: boolean; metadataJson?: string },
): Promise<DigestSubscriptionJson> {
  const res = await request.post(`${resolveLiveApiBase()}/v1/digest-subscriptions`, {
    data: {
      name: body.name,
      channelType: body.channelType,
      destination: body.destination,
      isEnabled: body.isEnabled ?? true,
      metadataJson: body.metadataJson ?? "{}",
    },
    headers: liveJsonHeaders(),
  });

  await throwIfNotOk(res, "POST /v1/digest-subscriptions");

  return res.json() as Promise<DigestSubscriptionJson>;
}

/** GET `/v1/digest-subscriptions` — list subscriptions in scope. */
export async function listDigestSubscriptions(request: APIRequestContext): Promise<DigestSubscriptionJson[]> {
  const res = await request.get(`${resolveLiveApiBase()}/v1/digest-subscriptions`, {
    headers: liveAcceptHeaders(),
  });

  await throwIfNotOk(res, "GET /v1/digest-subscriptions");

  return res.json() as Promise<DigestSubscriptionJson[]>;
}

/** POST `/v1/digest-subscriptions/{id}/toggle` — flip enabled flag. */
export async function toggleDigestSubscription(
  request: APIRequestContext,
  subscriptionId: string,
): Promise<DigestSubscriptionJson> {
  const res = await request.post(`${resolveLiveApiBase()}/v1/digest-subscriptions/${subscriptionId}/toggle`, {
    headers: liveAcceptHeaders(),
  });

  await throwIfNotOk(res, "POST /v1/digest-subscriptions/.../toggle");

  return res.json() as Promise<DigestSubscriptionJson>;
}
