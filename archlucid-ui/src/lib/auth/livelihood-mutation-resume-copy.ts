import type { LivelihoodPendingMutation } from "@/lib/auth/livelihood-mutation-401-resume-kinds";

import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isApiRequestError } from "@/lib/api-request-error";
import { requiresConfirmBeforeLivelihoodReplay } from "@/lib/auth/livelihood-mutation-replay-policy";

export type LivelihoodMutationResumePresentation = {
  readonly headline: string;
  readonly detail: string;
  readonly requiresConfirm: boolean;
  readonly confirmLabel: string;
  readonly discardLabel: string;
};

export function resolveLivelihoodMutationResumePresentation(
  pending: LivelihoodPendingMutation,
): LivelihoodMutationResumePresentation {
  const requiresConfirm = requiresConfirmBeforeLivelihoodReplay(pending);

  if (!pending.requestLeftClient) {
    return {
      headline: "Resume your saved action?",
      detail:
        "Your session expired before this request was sent. Retry once to finish what you started.",
      requiresConfirm: true,
      confirmLabel: "Retry saved action",
      discardLabel: "Discard saved action",
    };
  }

  if (requiresConfirm) {
    return {
      headline: "Confirm before retrying your saved action",
      detail:
        "Your session expired while this request was in flight. It may already have applied on the server. Retry only if you are sure it did not finish.",
      requiresConfirm: true,
      confirmLabel: "Retry saved action",
      discardLabel: "Discard saved action",
    };
  }

  return {
    headline: "Finishing your saved action after sign-in",
    detail:
      "We are retrying once with the same request id so nothing applies twice.",
    requiresConfirm: false,
    confirmLabel: "Retry saved action",
    discardLabel: "Discard saved action",
  };
}

/** Operator-facing summary when livelihood 401 replay fails after re-auth (LW-098 / TB-2155). */
export function readLivelihoodMutationReplayFailureMessage(error: unknown): string {
  if (isApiRequestError(error)) {
    return toApiLoadFailure(error).message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Could not retry your saved action.";
}
