import { describe, expect, it } from "vitest";

import type { ReviewFailureRecoveryGuidance } from "@/lib/resolve-review-failure-recovery-guidance";
import {
  resolveProbeAwareReviewFailureDoThisNextSentence,
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

describe("resolveProbeAwareReviewFailureDoThisNextSentence", () => {
  it("replaces AI availability blame when the live probe succeeded", () => {
    const sentence = resolveProbeAwareReviewFailureDoThisNextSentence(preStageGuidance, {
      status: "loaded",
      result: {
        isAvailable: true,
        validated: true,
        aiSource: "managed-platform",
        summary: "ArchLucid-managed Azure OpenAI live probe succeeded.",
        asOfUtc: "2026-09-01T11:24:56.000Z",
        checks: [],
        debug: {},
      },
    });

    expect(sentence).toContain("platform AI is ready for this session");
    expect(sentence).toContain("failed for a different reason");
    expect(sentence).not.toContain("usually platform AI availability");
  });

  it("uses pending copy while the live probe is still running", () => {
    const sentence = resolveProbeAwareReviewFailureDoThisNextSentence(preStageGuidance, {
      status: "loading",
    });

    expect(sentence).toContain("checking platform AI availability automatically");
    expect(sentence).not.toContain("usually platform AI availability");
  });

  it("keeps AI availability messaging when the live probe reports an outage", () => {
    const sentence = resolveProbeAwareReviewFailureDoThisNextSentence(preStageGuidance, {
      status: "loaded",
      result: {
        isAvailable: false,
        validated: true,
        aiSource: "managed-platform",
        summary: "ArchLucid-managed AI is unavailable",
        asOfUtc: "2026-09-01T11:24:56.000Z",
        checks: [],
        debug: {},
      },
    });

    expect(sentence).toContain("usually platform AI availability");
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
