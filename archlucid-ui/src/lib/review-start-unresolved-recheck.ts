import { createArchitectureRun, type CreateArchitectureRunRequestPayload } from "@/lib/api";
import { isArchitectureRequestCreateUnresolvedError } from "@/lib/api/architecture-request-create-unresolved-error";
import { isApiRequestError } from "@/lib/api-request-error";
import { REVIEW_START_CREATION_FAILED_MESSAGE } from "@/lib/review-start-progress-copy";

export type RecheckUnresolvedArchitectureReviewResult =
  | { readonly status: "found"; readonly runId: string }
  | { readonly status: "still-unresolved" }
  | { readonly status: "failed"; readonly message: string };

/**
 * Replays the wizard-session idempotent create to resolve an outstanding review without
 * minting a new Idempotency-Key. Does not drive staged "start review" chrome — callers
 * use {@link useReviewCreationProgress.beginRecheck} for the recovery affordance only.
 */
export async function recheckUnresolvedArchitectureReviewCreate(
  body: CreateArchitectureRunRequestPayload,
): Promise<RecheckUnresolvedArchitectureReviewResult> {
  try {
    const response = await createArchitectureRun(body);
    const runId = response.run?.runId?.trim() ?? "";

    if (runId.length === 0) {
      return { status: "failed", message: REVIEW_START_CREATION_FAILED_MESSAGE };
    }

    return { status: "found", runId };
  } catch (error: unknown) {
    if (isArchitectureRequestCreateUnresolvedError(error)) {
      return { status: "still-unresolved" };
    }

    const message =
      isApiRequestError(error) && error.message.trim().length > 0
        ? error.message
        : REVIEW_START_CREATION_FAILED_MESSAGE;

    return { status: "failed", message };
  }
}
