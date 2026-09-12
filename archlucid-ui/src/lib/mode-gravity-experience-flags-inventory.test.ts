import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  MODE_GRAVITY_EXPERIENCE_FLAGS_INVENTORY_DOC_PATH,
  MODE_GRAVITY_EXPERIENCE_FLAG_ROWS,
} from "@/lib/mode-gravity-experience-flags-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("mode-gravity experience flags inventory (MG-002)", () => {
  it("documents workspace mode, door, operator-experience, and demo flags", () => {
    const markdown = readFileSync(join(REPO_ROOT, MODE_GRAVITY_EXPERIENCE_FLAGS_INVENTORY_DOC_PATH), "utf8");

    expect(MODE_GRAVITY_EXPERIENCE_FLAG_ROWS.length).toBeGreaterThanOrEqual(5);
    expect(MODE_GRAVITY_EXPERIENCE_FLAG_ROWS.some((row) => row.flag.includes("workspaceMode"))).toBe(true);
    expect(MODE_GRAVITY_EXPERIENCE_FLAG_ROWS.some((row) => row.flag.includes("OPERATOR_EXPERIENCE"))).toBe(true);

    expect(markdown).toContain("MG-002");
    expect(markdown).toContain("0094");
    expect(markdown).toContain("NEXT_PUBLIC_OPERATOR_EXPERIENCE");
    expect(markdown).toContain("No flag deletion");
  });
});
