import { describe, expect, it } from "vitest";

import {
  SECURENOW_SAMPLE_BEATS,
  SECURENOW_SAMPLE_FIXTURE_LINE,
  WHY_SECURENOW_CONVERSATION_MAILTO,
} from "@/lib/marketing/securenow-sample-copy";

describe("SecureNow sample copy (SN-MKT-09)", () => {
  it("defines the fixture line, path id, beats, and shared mailto", () => {
    expect(SECURENOW_SAMPLE_FIXTURE_LINE).toMatch(/Synthetic fixture/i);
    expect(SECURENOW_SAMPLE_BEATS).toHaveLength(3);
    expect(SECURENOW_SAMPLE_BEATS.map((beat) => beat.title)).toEqual([
      "Scope and freshness",
      "One ranked path",
      "Advisory cut point",
    ]);

    const joined = [
      SECURENOW_SAMPLE_FIXTURE_LINE,
      ...SECURENOW_SAMPLE_BEATS.flatMap((beat) => [beat.title, beat.body]),
    ].join(" ");

    expect(joined).toContain("fixture-path-01");
    expect(WHY_SECURENOW_CONVERSATION_MAILTO).toBe(
      "mailto:support@archlucid.net?subject=SecureNow%20conversation",
    );
    expect(joined).not.toMatch(/\$/);
    expect(joined).not.toMatch(/Start trial/i);
    expect(joined).not.toMatch(/\bguaranteed\b/i);
    expect(joined).not.toMatch(/\bautonomous\b/i);
  });
});
