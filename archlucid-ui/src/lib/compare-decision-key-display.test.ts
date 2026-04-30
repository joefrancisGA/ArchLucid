import { describe, expect, it } from "vitest";

import { decisionKeyDisplay } from "./compare-decision-key-display";

describe("decisionKeyDisplay", () => {
  it("maps known Claims Intake keys", () => {
    expect(decisionKeyDisplay("claims.intake.boundary")).toContain("Claims intake");

    expect(decisionKeyDisplay("claims.intake.boundary")).toContain("boundary");
  });

  it("returns dash for whitespace", () => {
    expect(decisionKeyDisplay("   ")).toBe("—");
  });

  it("dot-separates unknown keys", () => {
    expect(decisionKeyDisplay("foo.bar.baz")).toBe("foo · bar · baz");
  });
});
