import { describe, expect, it } from "vitest";

import {
  estimateStructuredBriefSuggestDuration,
  formatStructuredBriefSuggestDurationBand,
} from "@/lib/architecture/structured-brief-suggest-duration-estimate";

describe("structured-brief-suggest-duration-estimate", () => {
  it("returns a longer band for large overviews", () => {
    const band = estimateStructuredBriefSuggestDuration(6_000);

    expect(band.lowSeconds).toBe(45);
    expect(band.highSeconds).toBe(120);
    expect(formatStructuredBriefSuggestDurationBand(band)).toContain("1–2 minutes");
  });

  it("returns a shorter band for compact overviews", () => {
    const band = estimateStructuredBriefSuggestDuration(500);

    expect(band.lowSeconds).toBe(15);
    expect(formatStructuredBriefSuggestDurationBand(band)).toContain("about 1 minute");
  });
});
