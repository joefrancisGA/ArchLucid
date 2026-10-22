import { describe, expect, it } from "vitest";

import { buildExecutiveSponsorLink } from "@/lib/build-executive-sponsor-link";

describe("buildExecutiveSponsorLink", () => {
  it("builds a sponsor report URL scoped to the review", () => {
    expect(buildExecutiveSponsorLink("run-123", "https://app.example.com")).toBe(
      "https://app.example.com/insights/sponsor-report?runId=run-123",
    );
  });
});
