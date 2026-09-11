import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { PIPELINE_STATUS_BUYER_DISPLAY_LABELS, PIPELINE_STATUS_LABELS } from "@/lib/pipeline-status-labels";
import {
  CAREER_GRAVITY_BADGE_PIPELINE_COPY_INVENTORY_DOC_PATH,
  CAREER_GRAVITY_BADGE_PIPELINE_COPY_ROWS,
  CAREER_GRAVITY_SECURITY_CHOOSER_SKIP_MARKER,
  CAREER_GRAVITY_SECURITY_CHOOSER_SKIP_PATH,
} from "@/lib/career-gravity-badge-pipeline-copy-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("career-gravity badge and pipeline copy inventory (CG-004)", () => {
  it("documents shrink-only inventory rows in repo markdown", () => {
    const markdown = readFileSync(
      join(REPO_ROOT, CAREER_GRAVITY_BADGE_PIPELINE_COPY_INVENTORY_DOC_PATH),
      "utf8",
    );

    expect(markdown).toMatch(/ADR \*\*0091\*\*/);
    expect(markdown).toMatch(/Security product-line/);
    expect(markdown).toMatch(/deriveRunListPipelineLabel/);
    expect(markdown).toContain("`Ready`");

    for (const row of CAREER_GRAVITY_BADGE_PIPELINE_COPY_ROWS) {
      expect(markdown).toContain("`" + row.relativePath + "`");
    }
  });

  it("lists only existing source files", () => {
    for (const row of CAREER_GRAVITY_BADGE_PIPELINE_COPY_ROWS) {
      const path = join(REPO_ROOT, row.relativePath);

      expect(existsSync(path), row.relativePath).toBe(true);
    }
  });

  it("keeps buyer Ready as the finalized pill and Security chooser skip quoteable", () => {
    expect(PIPELINE_STATUS_LABELS.readyToFinalize).toBe("Ready to finalize");
    expect(PIPELINE_STATUS_BUYER_DISPLAY_LABELS.finalized).toBe("Ready");

    const topBar = readFileSync(join(REPO_ROOT, CAREER_GRAVITY_SECURITY_CHOOSER_SKIP_PATH), "utf8");

    expect(topBar).toContain(CAREER_GRAVITY_SECURITY_CHOOSER_SKIP_MARKER);
    expect(topBar).not.toContain("SecurityWorkingCareerHonestyStrip");

    const rail = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/first-pilot-operating-rail-status.ts"),
      "utf8",
    );

    expect(rail).toMatch(/deriveRunListPipelineLabel\(r\) === "Ready to finalize"/);
  });
});
