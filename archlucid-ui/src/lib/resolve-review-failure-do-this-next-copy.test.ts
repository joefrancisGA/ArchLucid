import { describe, expect, it } from "vitest";

import type { ReviewFailureRecoveryGuidance } from "@/lib/resolve-review-failure-recovery-guidance";
import {
  resolveProbeSucceededDoThisNextSentence,
  resolveReviewFailureCommitBlockedReason,
  resolveReviewFailureDoThisNextSentence,
  shouldShowReviewFailureRecoveryDetail,
} from "@/lib/resolve-review-failure-do-this-next-copy";

const preStageGuidance: ReviewFailureRecoveryGuidance = {
  headline: "Execution failed before the first pipeline stage",
  detail:
    "The review stopped before processing began. This is usually a configuration or infrastructure issue — not missing intake fields. Check AI configuration, then re-run the review.",
  recoverySteps: ["Click Re-run review."],
  suggestSupportTicket: false,
  severity: "error",
  supportHref: "/help/report-a-problem",
  intactSummary:
    "Your submitted intake package was recorded. Processing stopped before the first pipeline stage — this is usually platform AI availability, not missing intake fields.",
};

describe("resolveReviewFailureDoThisNextSentence", () => {
  it("combines headline, intact reassurance, and re-run action", () => {
    const sentence = resolveReviewFailureDoThisNextSentence(preStageGuidance);

    expect(sentence).toContain("Execution failed before the first pipeline stage");
    expect(sentence).toContain("not missing intake fields");
    expect(sentence).toContain("Follow the steps below");
    expect(sentence).not.toContain("Assessment failed");
    expect(sentence).not.toContain("Do this next");
  });

  it("includes specific detail when it adds information beyond the headline", () => {
    const sentence = resolveReviewFailureDoThisNextSentence({
      ...preStageGuidance,
      intactSummary: null,
      detail: "Missing Azure OpenAI deployment configuration",
    });

    expect(sentence).toContain("Missing Azure OpenAI deployment configuration");
  });
});

describe("resolveProbeSucceededDoThisNextSentence", () => {
  it("drops follow-the-steps wording once the live probe succeeded", () => {
    const sentence = resolveProbeSucceededDoThisNextSentence(preStageGuidance);

    expect(sentence).toContain("Execution failed before the first pipeline stage");
    expect(sentence).toContain("re-run the review");
    expect(sentence).not.toContain("Follow the steps below");
    expect(sentence).not.toContain("platform AI availability");
  });
});

describe("resolveReviewFailureCommitBlockedReason", () => {
  it("uses the failure headline without referencing Do this next", () => {
    expect(resolveReviewFailureCommitBlockedReason(preStageGuidance)).toBe(
      "Execution failed before the first pipeline stage — re-run the review before finalizing.",
    );
  });
});

describe("shouldShowReviewFailureRecoveryDetail", () => {
  it("hides generic pre-stage detail already covered by the combined sentence", () => {
    expect(shouldShowReviewFailureRecoveryDetail(preStageGuidance)).toBe(false);
  });

  it("shows specific technical detail", () => {
    expect(
      shouldShowReviewFailureRecoveryDetail({
        ...preStageGuidance,
        detail: "Missing Azure OpenAI deployment configuration",
      }),
    ).toBe(true);
  });
});
