"use client";

import { useCallback, useRef, useState } from "react";

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
  const testGenerationRef = useRef(0);

  const resetConnectionTestState = useCallback(() => {
    testGenerationRef.current += 1;
    setTestResults({});
    setTestingId(null);
  }, []);

  const onTestWebhook = useCallback(
    async (routingSubscriptionId: string) => {
      if (testingId !== null) {
        return;
      }

      writeWebhookSubscriptionLastViewedId(routingSubscriptionId);
      const scopeGeneration = options.scopeGenerationRef.current;
      const testGeneration = testGenerationRef.current;
      setTestingId(routingSubscriptionId);

      try {
        const result = await testWebhookSubscription(routingSubscriptionId);

        if (
          options.scopeGenerationRef.current !== scopeGeneration
          || testGenerationRef.current !== testGeneration
        ) {
          return;
        }

        setTestResults((prev) => ({ ...prev, [routingSubscriptionId]: result }));
        presentWebhookConnectionTestToasts(result);
      } catch (error: unknown) {
        if (
          options.scopeGenerationRef.current !== scopeGeneration
          || testGenerationRef.current !== testGeneration
        ) {
          return;
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        setTestResults((prev) => ({
          ...prev,
          [routingSubscriptionId]: {
            transportSucceeded: false,
            statusCode: 0,
            error: errorMessage,
            responseBodyTruncated: false,
          },
        }));
        presentWebhookConnectionTestRequestFailure(error);
      } finally {
        if (
          options.scopeGenerationRef.current === scopeGeneration
          && testGenerationRef.current === testGeneration
        ) {
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
