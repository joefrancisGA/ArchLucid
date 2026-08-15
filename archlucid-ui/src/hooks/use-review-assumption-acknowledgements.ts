"use client";

import { useCallback, useEffect, useState } from "react";

import {
  readAcknowledgedAssumptionIds,
  subscribeAssumptionAckChanges,
  writeAcknowledgedAssumptionIds,
} from "@/lib/review-quality/review-assumption-ack-store";

export function useReviewAssumptionAcknowledgements(runId: string): {
  readonly acknowledgedIds: ReadonlySet<string>;
  readonly setAssumptionAcknowledged: (assumptionId: string, acknowledged: boolean) => void;
} {
  const [acknowledgedIds, setAcknowledgedIds] = useState<ReadonlySet<string>>(() =>
    readAcknowledgedAssumptionIds(runId),
  );

  useEffect(() => {
    setAcknowledgedIds(readAcknowledgedAssumptionIds(runId));

    return subscribeAssumptionAckChanges(runId, () => {
      setAcknowledgedIds(readAcknowledgedAssumptionIds(runId));
    });
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
    },
    [acknowledgedIds, runId],
  );

  return {
    acknowledgedIds,
    setAssumptionAcknowledged,
  };
}
