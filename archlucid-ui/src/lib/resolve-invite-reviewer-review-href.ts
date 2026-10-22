import {
  architectureIdentityPath,
  reviewDetailPath,
} from "@/lib/architecture/architecture-routes";
import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import { INVITE_REVIEWER_BACK_TO_REVIEW_HREF } from "@/lib/invite-reviewer-flow";

export type ResolveInviteReviewerReviewHrefInput = {
  readonly workingMode: boolean;
  readonly runId?: string | null;
  readonly architectureId?: string | null;
  readonly requestId?: string | null;
};

/** SY-23 / SY-24: Working invite flows prefer nested architecture locators when identity is known. */
export function resolveInviteReviewerReviewHref(
  input: ResolveInviteReviewerReviewHrefInput,
): string {
  const runId = input.runId?.trim() ?? "";

  if (runId.length > 0) {
    if (input.workingMode) {
      return resolveWorkingRunReviewLocator({
        runId,
        architectureId: input.architectureId,
        requestId: input.requestId,
      }).href;
    }

    return reviewDetailPath(runId);
  }

  const architectureId = input.architectureId?.trim() ?? "";

  if (input.workingMode && architectureId.length > 0) {
    return architectureIdentityPath(architectureId);
  }

  return INVITE_REVIEWER_BACK_TO_REVIEW_HREF;
}
