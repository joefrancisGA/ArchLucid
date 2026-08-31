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

export function useAzureBoardsConnectionTest({
  nativeEnabled,
  credentialsReady,
  settingsReady,
  isSaving,
  setHealth,
  setLastTestAt,
  setLastTestSummary,
  setLastTestSuccess,
}: UseAzureBoardsConnectionTestOptions) {
  const [testError, setTestError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testGate = useMemo(
    () =>
      resolveAzureBoardsConnectionTestGate({
        nativeEnabled,
        credentialsReady,
        settingsReady,
        isTesting,
        isSaving,
      }),
    [credentialsReady, isSaving, isTesting, nativeEnabled, settingsReady],
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
      setLastTestAt(new Date().toISOString());
      setLastTestSummary(
        success
          ? summary.length > 0
            ? summary
            : "Connection check succeeded."
          : summary.length > 0
            ? summary
            : "Connection check failed. Verify the organization URL and token permissions.",
      );
      setLastTestSuccess(success);
      setHealth(mapAzureBoardsHealthFromConnectionTest(result));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Connection test failed.";
      setTestError(message);
      setLastTestAt(new Date().toISOString());
      setLastTestSummary(message);
      setLastTestSuccess(false);
    } finally {
      setIsTesting(false);
    }
  }, [
    setHealth,
    setLastTestAt,
    setLastTestSummary,
    setLastTestSuccess,
    testGate.allowed,
  ]);

  return {
    testError,
    isTesting,
    testGate,
    runConnectionTest,
  };
}
