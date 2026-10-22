import { describe, expect, it } from "vitest";

import { feasibilityVerdictKindLabel, feasibilityVerdictTone } from "./feasibility-verdict-display";

describe("feasibilityVerdictDisplay", () => {
  it("maps kinds to operator-facing labels and tones", () => {
    expect(feasibilityVerdictKindLabel("Feasible")).toBe("Proceed");
    expect(feasibilityVerdictKindLabel("SoftInfeasible")).toBe("Remediate");
    expect(feasibilityVerdictTone("HardInfeasible")).toBe("danger");
  });
});
