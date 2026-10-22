import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SYSTEM_GRAVITY_DRAFT_SCREENSHOT_INVENTORY_DOC_PATH,
  SYSTEM_GRAVITY_DRAFT_SCREENSHOT_ROWS,
} from "@/lib/system-gravity-draft-screenshot-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("system-gravity draft screenshot inventory (SG-071)", () => {
  it("SG-071: inventory doc exists and names CE-012 envelope honesty", () => {
    const docPath = join(REPO_ROOT, SYSTEM_GRAVITY_DRAFT_SCREENSHOT_INVENTORY_DOC_PATH);

    expect(existsSync(docPath), SYSTEM_GRAVITY_DRAFT_SCREENSHOT_INVENTORY_DOC_PATH).toBe(true);

    const doc = readFileSync(docPath, "utf8");

    expect(doc).toMatch(/SG-071/);
    expect(doc).toMatch(/CE-012/);
    expect(doc).toMatch(/screenshot-as-proof/i);
  });

  it("SG-071: inventory rows map to real shrink-only surfaces", () => {
    expect(SYSTEM_GRAVITY_DRAFT_SCREENSHOT_ROWS.length).toBeGreaterThanOrEqual(6);

    for (const row of SYSTEM_GRAVITY_DRAFT_SCREENSHOT_ROWS) {
      expect(existsSync(join(REPO_ROOT, row.relativePath)), row.relativePath).toBe(true);
      expect(row.sgPrompt).toMatch(/^SG-/);
    }

    const paths = SYSTEM_GRAVITY_DRAFT_SCREENSHOT_ROWS.map((row) => row.relativePath);

    expect(paths).toContain("archlucid-ui/src/lib/cheap-exploration-envelope-not-career-complete.ts");
    expect(paths).toContain("archlucid-ui/src/lib/architecture/architecture-identity-current-draft.ts");
  });
});
