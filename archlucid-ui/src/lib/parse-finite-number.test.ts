import { describe, expect, it } from "vitest";

import { finiteNumberOrDefault, parseFiniteNumber, parseNonNegativeFiniteNumber } from "./parse-finite-number";

describe("parseFiniteNumber", () => {
  it.each([[""], ["  "], [false], [true], [[]], [[5]], [{}]])(
    "rejects nonnumeric API value %j",
    (value) => expect(parseFiniteNumber(value)).toBeNull(),
  );

  it("accepts numbers and nonblank numeric strings, including measured zero", () => {
    expect(parseFiniteNumber(0)).toBe(0);
    expect(parseFiniteNumber(" 0 ")).toBe(0);
    expect(parseFiniteNumber("-1.25")).toBe(-1.25);
    expect(parseNonNegativeFiniteNumber("-1.25")).toBeNull();
    expect(finiteNumberOrDefault(" ", 9)).toBe(9);
  });
});
