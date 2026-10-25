import { describe, expect, it } from "vitest";

import { decisionKeyDisplay } from "./compare-decision-key-display";

describe("decisionKeyDisplay", () => {
  it("maps known Claims Intake keys", () => {
    expect(decisionKeyDisplay("claims.intake.boundary")).toContain("Claims intake");

    expect(decisionKeyDisplay("claims.intake.boundary")).toContain("boundary");
  });

  it("labels whitespace-only keys as not stored", () => {
    expect(decisionKeyDisplay("   ")).toBe("Decision key was not stored.");
  });

  it("labels unmapped keys without implying a friendly title", () => {
    expect(decisionKeyDisplay("foo.bar.baz")).toBe("Unmapped decision key: foo.bar.baz");
  });
});
