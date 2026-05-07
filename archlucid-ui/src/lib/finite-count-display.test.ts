import { describe, expect, it } from "vitest";

import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";

describe("finiteIntegerCountDisplay", () => {
  it("returns em dash for nullish or non-finite numbers", () => {
    expect(finiteIntegerCountDisplay(null)).toBe("—");
    expect(finiteIntegerCountDisplay(undefined)).toBe("—");
    expect(finiteIntegerCountDisplay(Number.NaN)).toBe("—");
    expect(finiteIntegerCountDisplay(Number.POSITIVE_INFINITY)).toBe("—");
    expect(finiteIntegerCountDisplay("3")).toBe("—");
  });

  it("truncates toward zero for finite numbers", () => {
    expect(finiteIntegerCountDisplay(3)).toBe("3");
    expect(finiteIntegerCountDisplay(3.9)).toBe("3");
    expect(finiteIntegerCountDisplay(-2.1)).toBe("-2");
  });
});
