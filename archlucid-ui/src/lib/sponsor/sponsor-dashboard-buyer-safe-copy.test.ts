import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BUYER_SPONSOR_SCORECARD_WINDOW_HELP } from "@/lib/buyer/buyer-polish-copy";
import {
  SPONSOR_DASHBOARD_PAGE_SUBTITLE_BUYER,
  executiveDashboardPageSubtitle,
} from "@/lib/sponsor/sponsor-dashboard-page-copy";

const SPONSOR_DASHBOARD_SURFACES = [
  "src/lib/sponsor/sponsor-dashboard-page-copy.ts",
  "src/components/sponsor/SponsorDashboardPageHero.tsx",
  "src/components/sponsor/SponsorTimeRangeSelect.tsx",
  "src/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiTrendSection.tsx",
] as const;

const BANNED_SPONSOR_SCORECARD_JARGON = [
  "toUtc exclusive",
  "drift endpoints",
  "pilot-value-report bounds",
  "GET /v1/roi/sponsor-report/history",
] as const;

describe("sponsor dashboard buyer-safe copy (TB-1533)", () => {
  it("always uses sponsor-safe dashboard lead without env gating", () => {
    expect(executiveDashboardPageSubtitle()).toBe(SPONSOR_DASHBOARD_PAGE_SUBTITLE_BUYER);
  });

  it.each(SPONSOR_DASHBOARD_SURFACES)("keeps %s free of retired scorecard eng jargon", (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");

    for (const banned of BANNED_SPONSOR_SCORECARD_JARGON) {
      expect(source).not.toContain(banned);
    }
  });

  it("wires buyer-safe window help on the sponsor time-range control", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/sponsor/SponsorTimeRangeSelect.tsx"),
      "utf8",
    );

    expect(source).toContain("BUYER_SPONSOR_SCORECARD_WINDOW_HELP");
    expect(BUYER_SPONSOR_SCORECARD_WINDOW_HELP).toBe("Showing the selected time range.");
  });
});
