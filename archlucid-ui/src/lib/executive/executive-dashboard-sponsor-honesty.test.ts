import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const EXECUTIVE_DASHBOARD_SECTIONS_DIR = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "architecture",
  "executive-dashboard",
  "_sections",
);

const BANNED_EXECUTIVE_DASHBOARD_SPONSOR_COPY = [
  "compliance-drift-trend",
  "projectId=default",
  "GET /v1/roi/executive-summary",
  "GET /v1/roi/executive-summary/export",
  "GET /v1/governance/compliance-drift-trend",
] as const;

function listExecutiveDashboardSectionSources(): string[] {
  return readdirSync(EXECUTIVE_DASHBOARD_SECTIONS_DIR)
    .filter((fileName) => fileName.endsWith(".tsx") && !fileName.includes(".test."))
    .map((fileName) => join(EXECUTIVE_DASHBOARD_SECTIONS_DIR, fileName));
}

describe("executive dashboard sponsor honesty (TB-1535)", () => {
  it.each(listExecutiveDashboardSectionSources())("keeps %s free of eng/API sponsor leaks", (absolutePath) => {
    const source = readFileSync(absolutePath, "utf8");

    for (const banned of BANNED_EXECUTIVE_DASHBOARD_SPONSOR_COPY) {
      expect(source).not.toContain(banned);
    }
  });

  it("renders the canonical executive dashboard page in executive surface mode", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "app", "(operator)", "architecture", "executive-dashboard", "page.tsx"),
      "utf8",
    );

    expect(source).toContain('surface="executive"');
  });
});
