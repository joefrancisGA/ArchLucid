"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  clearLivelihoodPendingMutation,
  consumeLivelihoodPendingMutationForReturnPath,
  LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY,
  peekLivelihoodPendingMutationForReturnPath,
  type LivelihoodPendingMutation,
} from "@/lib/auth/livelihood-mutation-401-resume";
import { replayLivelihoodPendingMutation } from "@/lib/auth/livelihood-mutation-401-resume-replay";
import { requiresConfirmBeforeLivelihoodReplay } from "@/lib/auth/livelihood-mutation-replay-policy";
import {
  readLivelihoodMutationReplayFailureMessage,
  resolveLivelihoodMutationResumePresentation,
  type LivelihoodMutationResumePresentation,
} from "@/lib/auth/livelihood-mutation-resume-copy";
import { notifyLivelihoodMutationReplayed } from "@/lib/auth/livelihood-mutation-replay-notify";
import { isOperatorOidcKeepaliveRoute } from "@/lib/auth/operator-oidc-keepalive-route";

export type UseResumePendingLivelihoodMutationArgs = {
  readonly enabled: boolean;
  readonly onReplayed?: (pendingKind: string, result: unknown) => void;
  readonly onReplayError?: (error: unknown) => void;
};

export type LivelihoodMutationResumeChromeState = {
  readonly pending: LivelihoodPendingMutation;
  readonly presentation: LivelihoodMutationResumePresentation;
  readonly isReplaying: boolean;
  readonly replayErrorMessage: string | null;
};

export type UseResumePendingLivelihoodMutationResult = {
  readonly chrome: LivelihoodMutationResumeChromeState | null;
  readonly confirmReplay: () => void;
  readonly discardReplay: () => void;
};

function buildReturnPath(pathname: string, searchParams: URLSearchParams): string {
  const query = searchParams.toString();

  return query.length > 0 ? `${pathname}?${query}` : pathname;
}

/**
 * After session recovery, replays one stored livelihood POST with the same idempotency key (LP-19 / ADR 0089).
 * Listens for localStorage writes so sibling tabs can replay when re-auth lands on a matching returnPath (LW-052).
 */
export function useResumePendingLivelihoodMutation(
  args: UseResumePendingLivelihoodMutationArgs,
): UseResumePendingLivelihoodMutationResult {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const returnPath = buildReturnPath(pathname, searchParams);
  const replayStartedRef = useRef(false);
  const onReplayedRef = useRef(args.onReplayed);
  const onReplayErrorRef = useRef(args.onReplayError);
  const [chromeState, setChromeState] = useState<LivelihoodMutationResumeChromeState | null>(null);

  onReplayedRef.current = args.onReplayed;
  onReplayErrorRef.current = args.onReplayError;

  const runReplay = useCallback((pending: LivelihoodPendingMutation, isReplaying = false) => {
    const presentation = resolveLivelihoodMutationResumePresentation(pending);

    setChromeState({
      pending,
      presentation,
      isReplaying: isReplaying || !presentation.requiresConfirm,
      replayErrorMessage: null,
    });

    void replayLivelihoodPendingMutation(pending)
      .then((result) => {
        notifyLivelihoodMutationReplayed({ pending, result });
        onReplayedRef.current?.(pending.kind, result);
        setChromeState(null);
      })
      .catch((error: unknown) => {
        replayStartedRef.current = false;
        onReplayErrorRef.current?.(error);
        setChromeState((current) =>
          current === null
            ? null
            : {
                ...current,
                isReplaying: false,
                replayErrorMessage: readLivelihoodMutationReplayFailureMessage(error),
              },
        );
      });
  }, []);

  const tryReplay = useCallback(() => {
    if (!args.enabled || replayStartedRef.current) {
      return;
    }

    const pending = peekLivelihoodPendingMutationForReturnPath(returnPath);

    if (pending === null) {
      return;
    }

    replayStartedRef.current = true;

    if (requiresConfirmBeforeLivelihoodReplay(pending)) {
      setChromeState({
        pending,
        presentation: resolveLivelihoodMutationResumePresentation(pending),
        isReplaying: false,
        replayErrorMessage: null,
      });

      return;
    }

    const consumed = consumeLivelihoodPendingMutationForReturnPath(returnPath);

    if (consumed === null) {
      replayStartedRef.current = false;

      return;
    }

    runReplay(consumed);
  }, [args.enabled, returnPath, runReplay]);

  const confirmReplay = useCallback(() => {
    if (chromeState === null || chromeState.isReplaying) {
      return;
    }

    const consumed = consumeLivelihoodPendingMutationForReturnPath(returnPath);

    if (consumed === null) {
      replayStartedRef.current = false;
      setChromeState(null);

      return;
    }

    runReplay(consumed, true);
  }, [chromeState, returnPath, runReplay]);

  const discardReplay = useCallback(() => {
    clearLivelihoodPendingMutation();
    replayStartedRef.current = false;
    setChromeState(null);
  }, []);

  useEffect(() => {
    if (!args.enabled || !isOperatorOidcKeepaliveRoute(pathname)) {
      return;
    }

    tryReplay();
  }, [args.enabled, pathname, tryReplay]);

  useEffect(() => {
    if (!args.enabled || !isOperatorOidcKeepaliveRoute(pathname)) {
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
  }, [args.enabled, pathname, tryReplay]);

  return {
    chrome: chromeState,
    confirmReplay,
    discardReplay,
  };
}
