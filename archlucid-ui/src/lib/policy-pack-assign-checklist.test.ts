import { describe, expect, it } from "vitest";

import {
  resolvePolicyPackAssignEmphasizedStepId,
  resolvePolicyPackAssignSteps,
} from "@/lib/policy-pack-assign-checklist";

describe("policy-pack-assign-checklist", () => {
  it("tracks assign progress", () => {
    expect(
      resolvePolicyPackAssignSteps({
        reviewPicked: true,
        packSelected: true,
        versionConfigured: false,
      }),
    ).toEqual([
      { id: "review", label: "Pick review for assignment context", complete: true },
      { id: "pack", label: "Select pack and published version", complete: false },
      { id: "assign", label: "Assign pack to workspace scope", complete: false },
    ]);
  });

  it("emphasizes review when missing", () => {
    expect(
      resolvePolicyPackAssignEmphasizedStepId({
        reviewPicked: false,
        packSelected: false,
        versionConfigured: false,
      }),
    ).toBe("review");
  });
});
