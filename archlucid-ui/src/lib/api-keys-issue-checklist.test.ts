import { describe, expect, it } from "vitest";

import {
  resolveApiKeysIssueEmphasizedStepId,
  resolveApiKeysIssueSteps,
} from "@/lib/api-keys-issue-checklist";

describe("resolveApiKeysIssueSteps", () => {
  it("emphasizes the first incomplete step", () => {
    expect(
      resolveApiKeysIssueEmphasizedStepId({
        slotSelected: false,
        confirmAcknowledged: false,
        secretStored: false,
      }),
    ).toBe("slot");

    expect(
      resolveApiKeysIssueSteps({
        slotSelected: true,
        confirmAcknowledged: false,
        secretStored: false,
      }).find((step) => step.id === "confirm")?.complete,
    ).toBe(false);
  });
});
