import { describe, expect, it } from "vitest";

import { ENTERPRISE_STATUS_LABELS } from "@/lib/design-tokens";
import { resolveOperationStateStatusPresentation } from "@/lib/operations/operation-state-present";

describe("operation-state-present (DW-015)", () => {
  it("maps non-terminal states to the shell in-progress StatusTag", () => {
    for (const state of ["Pending", "Running", "CancelRequested"] as const) {
      expect(resolveOperationStateStatusPresentation(state)).toEqual({
        kind: "in-progress",
        label: ENTERPRISE_STATUS_LABELS["in-progress"],
      });
    }
  });

  it("maps terminal states to ready, blocked, or canceled neutral", () => {
    expect(resolveOperationStateStatusPresentation("Succeeded")).toEqual({
      kind: "ready",
      label: ENTERPRISE_STATUS_LABELS.ready,
    });
    expect(resolveOperationStateStatusPresentation("Failed")).toEqual({
      kind: "blocked",
      label: ENTERPRISE_STATUS_LABELS.blocked,
    });
    expect(resolveOperationStateStatusPresentation("Canceled")).toEqual({
      kind: "neutral",
      label: "Canceled",
    });
  });
});
