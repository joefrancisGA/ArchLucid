"use client";

import { useCallback, useMemo, useState } from "react";

import { testAzureBoardsConnection, type AzureBoardsIntegrationHealthResponse } from "@/lib/api/azure-boards-api";
import {
  resolveAzureBoardsConnectionTestGate,
  sanitizeCustomerFacingProbeSummary,
} from "@/lib/azure-boards-integration-present";
import { mapAzureBoardsHealthFromConnectionTest } from "@/lib/azure-boards-stored-health";

export type UseAzureBoardsConnectionTestOptions = {
  readonly nativeEnabled: boolean;
  readonly credentialsReady: boolean;
  readonly settingsReady: boolean;
  readonly isSaving: boolean;
  readonly setHealth: React.Dispatch<React.SetStateAction<AzureBoardsIntegrationHealthResponse | null>>;
  readonly setLastTestAt: React.Dispatch<React.SetStateAction<string | null>>;
  readonly setLastTestSummary: React.Dispatch<React.SetStateAction<string | null>>;
  readonly setLastTestSuccess: React.Dispatch<React.SetStateAction<boolean | null>>;
};

export function useAzureBoardsConnectionTest(options: UseAzureBoardsConnectionTestOptions) {
  const [testError, setTestError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testGate = useMemo(
    () =>
      resolveAzureBoardsConnectionTestGate({
        nativeEnabled: options.nativeEnabled,
        credentialsReady: options.credentialsReady,
        settingsReady: options.settingsReady,
        isTesting,
        isSaving: options.isSaving,
      }),
    [isTesting, options.credentialsReady, options.isSaving, options.nativeEnabled, options.settingsReady],
  );

  const runConnectionTest = useCallback(async () => {
    if (!testGate.allowed) {
      return;
    }

    setIsTesting(true);
    setTestError(null);

    try {
      const result = await testAzureBoardsConnection();
      const summary = sanitizeCustomerFacingProbeSummary(result.summary);
      const success = result.ok === true;
      options.setLastTestAt(new Date().toISOString());
      options.setLastTestSummary(
        success
          ? summary.length > 0
            ? summary
            : "Connection check succeeded."
          : summary.length > 0
            ? summary
            : "Connection check failed. Verify the organization URL and token permissions.",
      );
      options.setLastTestSuccess(success);
      options.setHealth(mapAzureBoardsHealthFromConnectionTest(result));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Connection test failed.";
      setTestError(message);
      options.setLastTestAt(new Date().toISOString());
      options.setLastTestSummary(message);
      options.setLastTestSuccess(false);
    } finally {
      setIsTesting(false);
    }
  }, [options, testGate.allowed]);

  return {
    testError,
    isTesting,
    testGate,
    runConnectionTest,
  };
}
