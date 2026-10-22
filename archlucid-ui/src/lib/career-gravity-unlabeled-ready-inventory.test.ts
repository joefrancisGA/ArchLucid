import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CAREER_GRAVITY_UNLABELED_READY_INVENTORY_DOC_PATH,
  CAREER_GRAVITY_UNLABELED_READY_ROWS,
  CAREER_GRAVITY_UNLABELED_READY_SCAN_COUNT_BASELINE,
  discoverCareerGravityUnlabeledReadyScanPaths,
} from "@/lib/career-gravity-unlabeled-ready-inventory";

const REPO_ROOT = join(process.cwd(), "..");
const UI_SRC = join(process.cwd(), "src");

describe("career-gravity unlabeled Ready inventory (CG-002)", () => {
  it("documents shrink-only inventory rows in repo markdown", () => {
    const markdown = readFileSync(join(REPO_ROOT, CAREER_GRAVITY_UNLABELED_READY_INVENTORY_DOC_PATH), "utf8");

    expect(markdown).toMatch(/ADR \*\*0091\*\*/);
    expect(markdown).toMatch(/Shrink-only/);

    for (const row of CAREER_GRAVITY_UNLABELED_READY_ROWS) {
      expect(markdown).toContain("`" + row.relativePath + "`");
    }
  });

  it("lists only existing source files", () => {
    for (const row of CAREER_GRAVITY_UNLABELED_READY_ROWS) {
      const path = join(UI_SRC, row.relativePath);

      expect(existsSync(path), row.relativePath).toBe(true);
    }
  });

  it("keeps Ready-literal scan hits at or below the shrink-only baseline and listed", () => {
    const discovered = discoverCareerGravityUnlabeledReadyScanPaths(UI_SRC);
    const listedScanPaths = new Set(
      CAREER_GRAVITY_UNLABELED_READY_ROWS.filter((row) => row.inLiteralScan).map(
        (row) => row.relativePath,
      ),
    );

    expect(discovered.length).toBeLessThanOrEqual(CAREER_GRAVITY_UNLABELED_READY_SCAN_COUNT_BASELINE);

    for (const relativePath of discovered) {
      expect(listedScanPaths.has(relativePath), `unlisted Ready literal: ${relativePath}`).toBe(
        true,
      );
    }

    expect(listedScanPaths.size).toBe(discovered.length);
  });
});
