import { describe, expect, it } from "vitest";

import {
  reversibleControlLabel,
  reversibleControlStateLabel,
  reversibleControlStates,
  reversibleControlVerbs,
  type ReversibleControlKind,
} from "@/lib/reversible-control-verbs";

describe("reversible control verbs (TB-2383)", () => {
  it("pauses and resumes a recurring activity", () => {
    expect(reversibleControlVerbs("recurring-activity")).toEqual({ stop: "Pause", start: "Resume" });
  });

  it("disables and enables a capability", () => {
    expect(reversibleControlVerbs("capability")).toEqual({ stop: "Disable", start: "Enable" });
  });

  it("labels an active control with its stop verb", () => {
    expect(reversibleControlLabel("recurring-activity", true)).toBe("Pause");
    expect(reversibleControlLabel("capability", true)).toBe("Disable");
  });

  it("labels an inactive control with its start verb", () => {
    expect(reversibleControlLabel("recurring-activity", false)).toBe("Resume");
    expect(reversibleControlLabel("capability", false)).toBe("Enable");
  });

  it("pairs each action verb with a matching state label", () => {
    expect(reversibleControlStates("recurring-activity")).toEqual({ on: "Active", off: "Paused" });
    expect(reversibleControlStates("capability")).toEqual({ on: "Enabled", off: "Disabled" });
  });

  it("labels state consistently with the action that changes it", () => {
    expect(reversibleControlStateLabel("recurring-activity", false)).toBe("Paused");
    expect(reversibleControlStateLabel("recurring-activity", true)).toBe("Active");
    expect(reversibleControlStateLabel("capability", false)).toBe("Disabled");
    expect(reversibleControlStateLabel("capability", true)).toBe("Enabled");
  });

  it("never reuses a verb across both kinds", () => {
    const kinds: readonly ReversibleControlKind[] = ["recurring-activity", "capability"];
    const allVerbs = kinds.flatMap((kind) => {
      const verbs = reversibleControlVerbs(kind);

      return [verbs.stop, verbs.start];
    });

    expect(new Set(allVerbs).size).toBe(allVerbs.length);
  });
});
