import { describe, expect, it } from "vitest";

import {
  COUNT_NOT_RETURNED,
  HOURS_NOT_RETURNED,
} from "@/lib/amount-display-copy";
import {
  formatFindings,
  formatHours,
  hasMeaningfulSidebarDeltaMedians,
  percentDelta,
  formatPerRunFindingsLine,
  safeCommittedRunWindowCount,
} from "../formatDelta";

describe("formatHours", () => {
  it("converts seconds to hours with two decimal places", () => {
    expect(formatHours(30 * 60)).toBe("0.50 h");
    expect(formatHours(2 * 3600)).toBe("2.00 h");
  });

  it("returns explicit not-returned copy for null/undefined/non-finite/negative", () => {
    expect(formatHours(null)).toBe(HOURS_NOT_RETURNED);
    expect(formatHours(undefined)).toBe(HOURS_NOT_RETURNED);
    expect(formatHours(Number.NaN)).toBe(HOURS_NOT_RETURNED);
    expect(formatHours(Number.POSITIVE_INFINITY)).toBe(HOURS_NOT_RETURNED);
    expect(formatHours(-1)).toBe(HOURS_NOT_RETURNED);
  });
});

describe("formatFindings", () => {
  it("formats integers without decimals and non-integers with one decimal", () => {
    expect(formatFindings(0)).toBe("0");
    expect(formatFindings(5)).toBe("5");
    expect(formatFindings(5.5)).toBe("5.5");
  });

  it("returns explicit not-returned copy for null/undefined/non-finite", () => {
    expect(formatFindings(null)).toBe(COUNT_NOT_RETURNED);
    expect(formatFindings(undefined)).toBe(COUNT_NOT_RETURNED);
    expect(formatFindings(Number.NaN)).toBe(COUNT_NOT_RETURNED);
    expect(formatFindings(-1)).toBe(COUNT_NOT_RETURNED);
  });
});

describe("percentDelta", () => {
  it("returns positive percent when current is smaller than prior (improvement)", () => {
    expect(percentDelta(10, 4)).toBeCloseTo(60, 5);
  });

  it("returns negative percent when current is larger than prior (regression)", () => {
    expect(percentDelta(4, 10)).toBeCloseTo(-150, 5);
  });

  it("returns null when prior is zero / negative / null / non-finite", () => {
    expect(percentDelta(0, 5)).toBeNull();
    expect(percentDelta(-5, 5)).toBeNull();
    expect(percentDelta(null, 5)).toBeNull();
    expect(percentDelta(Number.NaN, 5)).toBeNull();
  });
});

describe("safeCommittedRunWindowCount", () => {
  it("returns floored non-negative integers and null for invalid", () => {
    expect(safeCommittedRunWindowCount(3)).toBe(3);
    expect(safeCommittedRunWindowCount(2.9)).toBe(2);
    expect(safeCommittedRunWindowCount(0)).toBe(0);
    expect(safeCommittedRunWindowCount(null)).toBeNull();
    expect(safeCommittedRunWindowCount(Number.NaN)).toBeNull();
    expect(safeCommittedRunWindowCount(-1)).toBeNull();
  });
});

describe("formatPerRunFindingsLine", () => {
  it("labels findings and degrades bad numbers", () => {
    expect(formatPerRunFindingsLine(1)).toBe("1 finding");
    expect(formatPerRunFindingsLine(4)).toBe("4 findings");
    expect(formatPerRunFindingsLine(null)).toBe("Finding count was not stored.");
    expect(formatPerRunFindingsLine(Number.NaN)).toBe("Finding count was not stored.");
    expect(formatPerRunFindingsLine(-1)).toBe("Finding count was not stored.");
  });
});

describe("hasMeaningfulSidebarDeltaMedians", () => {
  it("rejects zero/zero theater", () => {
    expect(
      hasMeaningfulSidebarDeltaMedians({
        medianTotalFindings: 0,
        medianTimeToCommittedManifestTotalSeconds: 0,
      }),
    ).toBe(false);
  });

  it("requires displayable finalize time for sidebar medians", () => {
    expect(
      hasMeaningfulSidebarDeltaMedians({
        medianTotalFindings: 2,
        medianTimeToCommittedManifestTotalSeconds: 0,
      }),
    ).toBe(false);
    expect(
      hasMeaningfulSidebarDeltaMedians({
        medianTotalFindings: 0,
        medianTimeToCommittedManifestTotalSeconds: 3600,
      }),
    ).toBe(true);
  });

  it("rejects sub-display time that would render as 0.00 h", () => {
    expect(
      hasMeaningfulSidebarDeltaMedians({
        medianTotalFindings: 0,
        medianTimeToCommittedManifestTotalSeconds: 18,
      }),
    ).toBe(false);
  });
});
