"use client";

import { useState } from "react";

import { testWebhookSubscription } from "@/lib/api";
import {
  presentWebhookConnectionTestRequestFailure,
  presentWebhookConnectionTestToasts,
} from "@/lib/webhook-subscription-connection-test";
import { writeAlertRoutingSubscriptionLastViewedId } from "@/lib/resolve-continue-last-alert-routing-subscription";

export function useAlertRoutingTestConnection() {
  const [testingId, setTestingId] = useState<string | null>(null);

  async function onTest(routingSubscriptionId: string) {
    if (testingId !== null) {
      return;
    }

    writeAlertRoutingSubscriptionLastViewedId(routingSubscriptionId);
    setTestingId(routingSubscriptionId);
    try {
      const result = await testWebhookSubscription(routingSubscriptionId);
      presentWebhookConnectionTestToasts(result);
    } catch (e) {
      presentWebhookConnectionTestRequestFailure(e);
    } finally {
      setTestingId(null);
    }
  }

  return {
    testingId,
    onTest,
  };
}
