import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SPONSOR_DASHBOARD_SECTIONS_DIR = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "architecture",
  "sponsor-dashboard",
  "_sections",
);

const BANNED_SPONSOR_DASHBOARD_SPONSOR_COPY = [
  "compliance-drift-trend",
  "projectId=default",
  "GET /v1/roi/sponsor-report",
  "GET /v1/roi/sponsor-report/export",
  "GET /v1/governance/compliance-drift-trend",
] as const;

function listSponsorDashboardSectionSources(): string[] {
  return readdirSync(SPONSOR_DASHBOARD_SECTIONS_DIR)
    .filter((fileName) => fileName.endsWith(".tsx") && !fileName.includes(".test."))
    .map((fileName) => join(SPONSOR_DASHBOARD_SECTIONS_DIR, fileName));
}

describe("sponsor dashboard sponsor honesty (TB-1535)", () => {
  it.each(listSponsorDashboardSectionSources())("keeps %s free of eng/API sponsor leaks", (absolutePath) => {
    const source = readFileSync(absolutePath, "utf8");

    for (const banned of BANNED_SPONSOR_DASHBOARD_SPONSOR_COPY) {
      expect(source).not.toContain(banned);
    }
  });

  it("renders the canonical sponsor dashboard page in sponsor surface mode", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "app", "(operator)", "architecture", "sponsor-dashboard", "page.tsx"),
      "utf8",
    );

    expect(source).toContain('surface="sponsor"');
  });
});
