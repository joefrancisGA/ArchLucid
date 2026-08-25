import { describe, expect, it } from "vitest";

import {
  resolveScimIssueTokenEmphasizedStepId,
  resolveScimIssueTokenSteps,
} from "@/lib/scim-issue-token-checklist";

describe("scim-issue-token-checklist", () => {
  it("marks steps complete in order", () => {
    expect(
      resolveScimIssueTokenSteps({
        baseUrlReady: false,
        tokenIssued: false,
        verifyComplete: false,
      }).map((step) => step.complete),
    ).toEqual([false, false, false]);

    expect(
      resolveScimIssueTokenSteps({
        baseUrlReady: true,
        tokenIssued: true,
        verifyComplete: true,
      }).map((step) => step.complete),
    ).toEqual([true, true, true]);
  });

  it("emphasizes the first incomplete step", () => {
    expect(
      resolveScimIssueTokenEmphasizedStepId({
        baseUrlReady: false,
        tokenIssued: false,
        verifyComplete: false,
      }),
    ).toBe("base-url");

    expect(
      resolveScimIssueTokenEmphasizedStepId({
        baseUrlReady: true,
        tokenIssued: false,
        verifyComplete: false,
      }),
    ).toBe("issue");
  });
});
