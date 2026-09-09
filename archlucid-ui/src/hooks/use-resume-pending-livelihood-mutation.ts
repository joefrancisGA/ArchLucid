"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { consumeLivelihoodPendingMutationForReturnPath } from "@/lib/auth/livelihood-mutation-401-resume";
import { replayLivelihoodPendingMutation } from "@/lib/auth/livelihood-mutation-401-resume-replay";

export type UseResumePendingLivelihoodMutationArgs = {
  readonly enabled: boolean;
  readonly onReplayed?: (pendingKind: string, result: unknown) => void;
  readonly onReplayError?: (error: unknown) => void;
};

/** After session recovery, replays one stored livelihood POST with the same idempotency key (LP-19). */
export function useResumePendingLivelihoodMutation(args: UseResumePendingLivelihoodMutationArgs): void {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const returnPath =
    searchParams.toString().length > 0 ? `${pathname}?${searchParams.toString()}` : pathname;
  const replayStartedRef = useRef(false);
  const onReplayedRef = useRef(args.onReplayed);
  const onReplayErrorRef = useRef(args.onReplayError);

  onReplayedRef.current = args.onReplayed;
  onReplayErrorRef.current = args.onReplayError;

  useEffect(() => {
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
        onReplayedRef.current?.(pending.kind, result);
      })
      .catch((error: unknown) => {
        onReplayErrorRef.current?.(error);
      });
  }, [args.enabled, returnPath]);
}
