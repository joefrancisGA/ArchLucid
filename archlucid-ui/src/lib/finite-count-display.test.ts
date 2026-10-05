import { describe, expect, it } from "vitest";

import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";

describe("finiteIntegerCountDisplay", () => {
  it("returns Not returned for nullish or non-finite numbers by default", () => {
    expect(finiteIntegerCountDisplay(null)).toBe("Not returned");
    expect(finiteIntegerCountDisplay(undefined)).toBe("Not returned");
    expect(finiteIntegerCountDisplay(Number.NaN)).toBe("Not returned");
    expect(finiteIntegerCountDisplay(Number.POSITIVE_INFINITY)).toBe("Not returned");
    expect(finiteIntegerCountDisplay("3")).toBe("Not returned");
  });

  it("can still render the legacy em dash when requested", () => {
    expect(finiteIntegerCountDisplay(null, { missingLabel: "dash" })).toBe(" — ");
  });

  it("truncates toward zero for finite numbers", () => {
    expect(finiteIntegerCountDisplay(3)).toBe("3");
    expect(finiteIntegerCountDisplay(3.9)).toBe("3");
    expect(finiteIntegerCountDisplay(-2.1)).toBe("-2");
  });

  it("can label missing counts as Not returned", () => {
    expect(finiteIntegerCountDisplay(null, { missingLabel: "not-returned" })).toBe("Not returned");
  });
});
