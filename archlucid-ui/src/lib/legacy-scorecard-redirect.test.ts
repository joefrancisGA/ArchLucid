import { describe, expect, it } from "vitest";

import { SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH } from "@/lib/sponsor-report-navigation";

import { buildScorecardRedirectPath } from "./legacy-scorecard-redirect";

describe("buildScorecardRedirectPath (TB-1957)", () => {
  it("returns bare canonical path when search is empty", () => {
    expect(buildScorecardRedirectPath({})).toBe(SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH);
  });

  it("preserves sample=1 across legacy /scorecard redirect", () => {
    expect(buildScorecardRedirectPath({ sample: "1" })).toBe(
      `${SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH}?sample=1`,
    );
  });
});
