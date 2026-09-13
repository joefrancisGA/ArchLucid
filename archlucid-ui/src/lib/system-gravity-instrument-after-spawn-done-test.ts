import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import { resolveInviteReviewerReviewHref } from "@/lib/resolve-invite-reviewer-review-href";
import { classifyWorkingRoutePathname } from "@/lib/routing/working-route-roles";
import { deriveWorkingInstrumentReviewHeaderPresentation } from "@/lib/run-detail-workspace-derive/review-presentation";

/** ADR 0098 — typed done-test predicates reused by SG-106 guard and SG-120 close audit. */
export const SYSTEM_GRAVITY_INSTRUMENT_AFTER_SPAWN_DONE_TEST_ADR_ID = "0098" as const;

export type SystemGravityInstrumentAfterSpawnDoneTestInput = {
  readonly architectureDisplayName: string;
  readonly reviewTitle: string;
  readonly runId: string;
  readonly architectureId: string;
};

export type SystemGravityInstrumentAfterSpawnDoneTestResult = {
  readonly shellIdentityIsArchitecture: boolean;
  readonly reviewDetailIsNestedJob: boolean;
  readonly guidedKeepsPeerReviewUrls: boolean;
  readonly findingsReachableAsVerbs: boolean;
};

export function evaluateSystemGravityInstrumentAfterSpawnDoneTest(
  input: SystemGravityInstrumentAfterSpawnDoneTestInput,
): SystemGravityInstrumentAfterSpawnDoneTestResult {
  const presentation = deriveWorkingInstrumentReviewHeaderPresentation({
    architectureDisplayName: input.architectureDisplayName,
    reviewTitle: input.reviewTitle,
    runId: input.runId,
  });

  const nestedReviewHref = resolveWorkingRunReviewLocator({
    runId: input.runId,
    architectureId: input.architectureId,
  }).href;

  return {
    shellIdentityIsArchitecture:
      presentation.h1Title === input.architectureDisplayName &&
      presentation.h1Title !== input.reviewTitle,
    reviewDetailIsNestedJob: classifyWorkingRoutePathname(nestedReviewHref) === "nestedJob",
    guidedKeepsPeerReviewUrls:
      resolveInviteReviewerReviewHref({
        workingMode: false,
        runId: input.runId,
        architectureId: input.architectureId,
      }) === `/architecture/reviews/${input.runId}`,
    findingsReachableAsVerbs: nestedReviewHref.includes("/reviews/"),
  };
}
