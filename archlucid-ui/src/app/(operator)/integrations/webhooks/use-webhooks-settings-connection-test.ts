"use client";

import { useCallback, useState } from "react";

import {
  presentWebhookConnectionTestRequestFailure,
  presentWebhookConnectionTestToasts,
} from "@/lib/webhook-subscription-connection-test";
import { testWebhookSubscription } from "@/lib/api";
import { writeWebhookSubscriptionLastViewedId } from "@/lib/resolve-continue-last-webhook-subscription";
import type { WebhookTestResponse } from "@/types/alert-routing";

export type UseWebhooksSettingsConnectionTestOptions = {
  readonly scopeGenerationRef: React.RefObject<number>;
};

export type UseWebhooksSettingsConnectionTestResult = {
  readonly testingId: string | null;
  readonly testResults: Record<string, WebhookTestResponse>;
  readonly onTestWebhook: (routingSubscriptionId: string) => Promise<void>;
  readonly resetConnectionTestState: () => void;
};

export function useWebhooksSettingsConnectionTest(
  options: UseWebhooksSettingsConnectionTestOptions,
): UseWebhooksSettingsConnectionTestResult {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, WebhookTestResponse>>({});

  const resetConnectionTestState = useCallback(() => {
    setTestResults({});
    setTestingId(null);
  }, []);

  const onTestWebhook = useCallback(
    async (routingSubscriptionId: string) => {
      if (testingId !== null) {
        return;
      }

      writeWebhookSubscriptionLastViewedId(routingSubscriptionId);
      const generation = options.scopeGenerationRef.current;
      setTestingId(routingSubscriptionId);

      try {
        const result = await testWebhookSubscription(routingSubscriptionId);

        if (options.scopeGenerationRef.current !== generation) {
          return;
        }

        setTestResults((prev) => ({ ...prev, [routingSubscriptionId]: result }));
        presentWebhookConnectionTestToasts(result);
      } catch (error: unknown) {
        if (options.scopeGenerationRef.current !== generation) {
          return;
        }

        setTestResults((prev) => {
          const next = { ...prev };

          delete next[routingSubscriptionId];

          return next;
        });
        presentWebhookConnectionTestRequestFailure(error);
      } finally {
        if (options.scopeGenerationRef.current === generation) {
          setTestingId(null);
        }
      }
    },
    [options.scopeGenerationRef, testingId],
  );

  return {
    testingId,
    testResults,
    onTestWebhook,
    resetConnectionTestState,
  };
}
