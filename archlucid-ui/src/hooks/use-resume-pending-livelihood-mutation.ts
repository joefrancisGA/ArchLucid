"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  consumeLivelihoodPendingMutationForReturnPath,
  LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY,
} from "@/lib/auth/livelihood-mutation-401-resume";
import { replayLivelihoodPendingMutation } from "@/lib/auth/livelihood-mutation-401-resume-replay";
import { notifyLivelihoodMutationReplayed } from "@/lib/auth/livelihood-mutation-replay-notify";

export type UseResumePendingLivelihoodMutationArgs = {
  readonly enabled: boolean;
  readonly onReplayed?: (pendingKind: string, result: unknown) => void;
  readonly onReplayError?: (error: unknown) => void;
};

function buildReturnPath(pathname: string, searchParams: URLSearchParams): string {
  const query = searchParams.toString();

  return query.length > 0 ? `${pathname}?${query}` : pathname;
}

/**
 * After session recovery, replays one stored livelihood POST with the same idempotency key (LP-19 / ADR 0089).
 * Listens for localStorage writes so sibling tabs can replay when re-auth lands on a matching returnPath (LW-052).
 */
export function useResumePendingLivelihoodMutation(args: UseResumePendingLivelihoodMutationArgs): void {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const returnPath = buildReturnPath(pathname, searchParams);
  const replayStartedRef = useRef(false);
  const onReplayedRef = useRef(args.onReplayed);
  const onReplayErrorRef = useRef(args.onReplayError);

  onReplayedRef.current = args.onReplayed;
  onReplayErrorRef.current = args.onReplayError;

  const tryReplay = useCallback(() => {
    if (!args.enabled || replayStartedRef.current) {
      return;
    }

    const pending = consumeLivelihoodPendingMutationForReturnPath(returnPath);

    if (pending === null) {
      return;
    }

    replayStartedRef.current = true;

    void replayLivelihoodPendingMutation(pending)
      .then((result) => {
        notifyLivelihoodMutationReplayed({ pending, result });
        onReplayedRef.current?.(pending.kind, result);
      })
      .catch((error: unknown) => {
        replayStartedRef.current = false;
        onReplayErrorRef.current?.(error);
      });
  }, [args.enabled, returnPath]);

  useEffect(() => {
    tryReplay();
  }, [tryReplay]);

  useEffect(() => {
    if (!args.enabled) {
      return;
    }

    const handleStorage = (event: StorageEvent): void => {
      if (event.key !== LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY) {
        return;
      }

      tryReplay();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [args.enabled, tryReplay]);
}
