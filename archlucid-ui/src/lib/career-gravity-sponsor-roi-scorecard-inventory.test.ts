import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CAREER_GRAVITY_SPONSOR_ROI_SCORECARD_INVENTORY_DOC_PATH,
  CAREER_GRAVITY_SPONSOR_ROI_SCORECARD_ROWS,
} from "@/lib/career-gravity-sponsor-roi-scorecard-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("career-gravity sponsor ROI scorecard inventory (CG-009)", () => {
  it("documents shrink-only inventory rows in repo markdown", () => {
    const markdown = readFileSync(
      join(REPO_ROOT, CAREER_GRAVITY_SPONSOR_ROI_SCORECARD_INVENTORY_DOC_PATH),
      "utf8",
    );

    expect(markdown).toMatch(/ADR \*\*0091\*\*/);
    expect(markdown).toMatch(/RoiPeriodMixedModeFootnote/);
    expect(markdown).toMatch(/Do not rewrite KPIs/);

    for (const row of CAREER_GRAVITY_SPONSOR_ROI_SCORECARD_ROWS) {
      expect(markdown).toContain("`" + row.relativePath + "`");
    }
  });

  it("lists only existing source files", () => {
    for (const row of CAREER_GRAVITY_SPONSOR_ROI_SCORECARD_ROWS) {
      expect(existsSync(join(REPO_ROOT, row.relativePath)), row.relativePath).toBe(true);
    }
  });

  it("quotes period-mix footnote as not a Career door", () => {
    const honesty = readFileSync(
      join(REPO_ROOT, "ArchLucid.Application/Runs/StructuralExecutionModeHonesty.cs"),
      "utf8",
    );

    expect(honesty).toMatch(/RoiPeriodMixedModeFootnote/);
    expect(honesty).toMatch(/period mix, not whether any single review/);
  });
});
