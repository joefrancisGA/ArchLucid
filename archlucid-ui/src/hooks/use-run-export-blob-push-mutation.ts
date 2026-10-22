"use client";

import { useCallback, useState } from "react";

import { toApiLoadFailure } from "@/lib/api-load-failure";
import { pushRunExportToBlob } from "@/lib/runs/run-export-blob-push-api";
import { runExportBlobPushMutationBlockedReason } from "@/lib/runs/run-export-blob-push-mutation-blocked-reason";

export function useRunExportBlobPushMutation(runId: string) {
  const [busy, setBusy] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const pushExport = useCallback(
    async (destinationSasUrl: string): Promise<boolean> => {
      const trimmed = destinationSasUrl.trim();

      if (trimmed.length === 0) {
        setErrorMessage("Destination SAS URL is required.");
        setBlockedReason(null);
        setAccepted(false);

        return false;
      }

      setBusy(true);
      setBlockedReason(null);
      setErrorMessage(null);
      setAccepted(false);

      try {
        await pushRunExportToBlob(runId, { destinationSasUrl: trimmed });
        setAccepted(true);

        return true;
      } catch (error: unknown) {
        const failure = toApiLoadFailure(error);
        const blocked = runExportBlobPushMutationBlockedReason(failure);

        if (blocked !== null) {
          setBlockedReason(blocked);
        } else {
          setErrorMessage(failure.message);
        }

        return false;
      } finally {
        setBusy(false);
      }
    },
    [runId],
  );

  const reset = useCallback(() => {
    setBlockedReason(null);
    setErrorMessage(null);
    setAccepted(false);
  }, []);

  return {
    busy,
    blockedReason,
    errorMessage,
    accepted,
    pushExport,
    reset,
  };
}
