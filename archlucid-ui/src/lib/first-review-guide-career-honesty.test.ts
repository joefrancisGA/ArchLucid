import { describe, expect, it } from "vitest";

import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

import {
  FIRST_REVIEW_GUIDE_WORKING_EVALUATION_SCOPE_HELPER,
  resolveFirstReviewGuideCareerHonestyContext,
  resolveFirstReviewGuideEvaluationScopeHelper,
  resolveFirstReviewGuideSuppressReadyToFinalize,
} from "@/lib/first-review-guide-career-honesty";

describe("first-review-guide-career-honesty (CG-091)", () => {
  it("suppresses ready-to-finalize on Working Rehearsal + Simulator runs", () => {
    expect(
      resolveFirstReviewGuideSuppressReadyToFinalize({
        workingMode: true,
        effectiveWorkingCareerRehearsalDoor: "rehearsal",
        runSummary: {
          runId: "run-1",
          projectId: "default",
          createdUtc: "2026-04-01T00:00:00.000Z",
          structuralExecutionMode: StructuralExecutionModeWire.Simulator,
          workingCareerRehearsalDoor: "rehearsal",
        },
      }),
    ).toBe(true);
  });

  it("does not suppress Career door + Real runs on Working", () => {
    expect(
      resolveFirstReviewGuideSuppressReadyToFinalize({
        workingMode: true,
        effectiveWorkingCareerRehearsalDoor: "career",
        runSummary: {
          runId: "run-1",
          projectId: "default",
          createdUtc: "2026-04-01T00:00:00.000Z",
          structuralExecutionMode: StructuralExecutionModeWire.Real,
          workingCareerRehearsalDoor: "career",
        },
      }),
    ).toBe(false);
  });

  it("leaves Guided guide honesty unchanged when not on Working", () => {
    expect(
      resolveFirstReviewGuideSuppressReadyToFinalize({
        workingMode: false,
        runSummary: {
          runId: "run-1",
          projectId: "default",
          createdUtc: "2026-04-01T00:00:00.000Z",
          structuralExecutionMode: StructuralExecutionModeWire.Simulator,
        },
      }),
    ).toBe(false);
  });

  it("adds Working Career/Rehearsal scope helper copy", () => {
    const helper = resolveFirstReviewGuideEvaluationScopeHelper({ workingMode: true });

    expect(helper).toContain(FIRST_REVIEW_GUIDE_WORKING_EVALUATION_SCOPE_HELPER);
    expect(helper).toContain("Career door + Real");
  });

  it("hides sample recovery on live operator shell", () => {
    const originalDemo = process.env.NEXT_PUBLIC_ARCHLUCID_DEMO_MODE;
    const originalBuyer = process.env.NEXT_PUBLIC_ARCHLUCID_BUYER_POLISHED_OPERATOR_SHELL;
    const originalFallback = process.env.NEXT_PUBLIC_ARCHLUCID_STATIC_DEMO_FALLBACK;

    process.env.NEXT_PUBLIC_ARCHLUCID_DEMO_MODE = "false";
    process.env.NEXT_PUBLIC_ARCHLUCID_BUYER_POLISHED_OPERATOR_SHELL = "false";
    process.env.NEXT_PUBLIC_ARCHLUCID_STATIC_DEMO_FALLBACK = "false";

    const context = resolveFirstReviewGuideCareerHonestyContext({ workingMode: true });

    expect(context.hideSampleRecovery).toBe(true);

    if (originalDemo === undefined) {
      delete process.env.NEXT_PUBLIC_ARCHLUCID_DEMO_MODE;
    } else {
      process.env.NEXT_PUBLIC_ARCHLUCID_DEMO_MODE = originalDemo;
    }

    if (originalBuyer === undefined) {
      delete process.env.NEXT_PUBLIC_ARCHLUCID_BUYER_POLISHED_OPERATOR_SHELL;
    } else {
      process.env.NEXT_PUBLIC_ARCHLUCID_BUYER_POLISHED_OPERATOR_SHELL = originalBuyer;
    }

    if (originalFallback === undefined) {
      delete process.env.NEXT_PUBLIC_ARCHLUCID_STATIC_DEMO_FALLBACK;
    } else {
      process.env.NEXT_PUBLIC_ARCHLUCID_STATIC_DEMO_FALLBACK = originalFallback;
    }
  });
});
