import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BUYER_EXECUTIVE_SCORECARD_WINDOW_HELP } from "@/lib/buyer-polish-copy";
import {
  EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER,
  executiveDashboardPageSubtitle,
} from "@/lib/executive/executive-dashboard-page-copy";

const EXECUTIVE_DASHBOARD_SURFACES = [
  "src/lib/executive/executive-dashboard-page-copy.ts",
  "src/components/executive/ExecutiveDashboardPageHero.tsx",
  "src/app/(operator)/architecture/executive-dashboard/_sections/ExecutiveRoiTrendSection.tsx",
] as const;

const BANNED_EXECUTIVE_SCORECARD_JARGON = [
  "toUtc exclusive",
  "drift endpoints",
  "pilot-value-report bounds",
  "GET /v1/roi/executive-summary/history",
] as const;

describe("executive dashboard buyer-safe copy (TB-1533)", () => {
  it("always uses sponsor-safe dashboard lead without env gating", () => {
    expect(executiveDashboardPageSubtitle()).toBe(EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER);
  });

  it.each(EXECUTIVE_DASHBOARD_SURFACES)("keeps %s free of retired scorecard eng jargon", (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");

    for (const banned of BANNED_EXECUTIVE_SCORECARD_JARGON) {
      expect(source).not.toContain(banned);
    }
  });

  it("wires buyer-safe window help on the executive ROI trend time-range control", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/(operator)/architecture/executive-dashboard/_sections/ExecutiveRoiTrendSection.tsx"),
      "utf8",
    );

    expect(source).toContain("BUYER_EXECUTIVE_SCORECARD_WINDOW_HELP");
    expect(BUYER_EXECUTIVE_SCORECARD_WINDOW_HELP).toBe("Showing the selected time range.");
  });
});
