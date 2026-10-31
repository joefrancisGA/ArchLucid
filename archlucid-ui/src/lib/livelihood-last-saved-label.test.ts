import { describe, expect, it } from "vitest";

import { formatLivelihoodLastSavedLabel } from "@/lib/livelihood-last-saved-label";

describe("formatLivelihoodLastSavedLabel", () => {
  it("formats a valid UTC timestamp", () => {
    const label = formatLivelihoodLastSavedLabel("2026-07-18T22:00:00.000Z");

    expect(label).toMatch(/^Last saved /);
    expect(label).not.toContain("unavailable");
  });

  it("returns honesty copy for invalid timestamps", () => {
    expect(formatLivelihoodLastSavedLabel("not-a-date")).toBe("Last saved time was not readable.");
  });

  it("labels an empty timestamp as not stored", () => {
    expect(formatLivelihoodLastSavedLabel("")).toBe("Last saved time was not stored.");
  });
});
