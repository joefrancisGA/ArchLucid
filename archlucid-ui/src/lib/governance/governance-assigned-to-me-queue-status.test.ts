import { describe, expect, it } from "vitest";

import { resolveGovernanceAssignedToMeQueueStatusPresentation } from "@/lib/governance/governance-assigned-to-me-queue-status";

describe("governance-assigned-to-me-queue-status", () => {
  it("marks register-only zero loads as needs-attention instead of ready", () => {
    expect(resolveGovernanceAssignedToMeQueueStatusPresentation(0, "register-only")).toEqual({
      kind: "needs-attention",
      label: "0 assigned · register-only check",
    });
  });

  it("keeps a confident zero as ready when the assigned register was searched", () => {
    expect(resolveGovernanceAssignedToMeQueueStatusPresentation(0, "assigned-register")).toEqual({
      kind: "ready",
      label: "0 open findings assigned",
    });
  });

  it("surfaces positive counts as needs-attention", () => {
    expect(resolveGovernanceAssignedToMeQueueStatusPresentation(2, "assigned-register").kind).toBe(
      "needs-attention",
    );
  });
});
