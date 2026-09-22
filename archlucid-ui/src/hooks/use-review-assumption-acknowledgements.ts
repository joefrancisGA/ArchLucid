"use client";

import { useCallback, useEffect, useState } from "react";

import {
  readAcknowledgedAssumptionIds,
  subscribeAssumptionAckChanges,
  writeAcknowledgedAssumptionIds,
} from "@/lib/review-quality/review-assumption-ack-store";
import {
  hydrateAcknowledgedAssumptionIdsFromServer,
  pushAcknowledgedAssumptionIdsToServer,
} from "@/lib/review-quality/review-assumption-ack-sync";

/**
 * Acknowledgements are cached in localStorage for instant paint and cross-strip notification,
 * then hydrated from and pushed to the server so the finalize gate (TB-2345 item 49) sees the same
 * set regardless of browser or device.
 */
export function useReviewAssumptionAcknowledgements(runId: string): {
  readonly acknowledgedIds: ReadonlySet<string>;
  readonly setAssumptionAcknowledged: (assumptionId: string, acknowledged: boolean) => void;
} {
  const [acknowledgedIds, setAcknowledgedIds] = useState<ReadonlySet<string>>(() =>
    readAcknowledgedAssumptionIds(runId),
  );

  useEffect(() => {
    setAcknowledgedIds(readAcknowledgedAssumptionIds(runId));

    let cancelled = false;

    void hydrateAcknowledgedAssumptionIdsFromServer(runId).then((merged) => {
      if (!cancelled && merged !== null) {
        setAcknowledgedIds(merged);
      }
    });

    const unsubscribe = subscribeAssumptionAckChanges(runId, () => {
      setAcknowledgedIds(readAcknowledgedAssumptionIds(runId));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [runId]);

  const setAssumptionAcknowledged = useCallback(
    (assumptionId: string, acknowledged: boolean): void => {
      const next = new Set(acknowledgedIds);

      if (acknowledged) {
        next.add(assumptionId);
      } else {
        next.delete(assumptionId);
      }

      writeAcknowledgedAssumptionIds(runId, next);
      setAcknowledgedIds(next);
      void pushAcknowledgedAssumptionIdsToServer(runId, next);
    },
    [acknowledgedIds, runId],
  );

  return {
    acknowledgedIds,
    setAssumptionAcknowledged,
  };
}
