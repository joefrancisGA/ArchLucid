import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SYSTEM_GRAVITY_COMPAT_MATRIX_RELATIVE_PATH,
  SYSTEM_GRAVITY_INVENTORY_RELATIVE_PATHS,
} from "@/lib/system-gravity-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("system-gravity inventory guard (SG-004–015)", () => {
  it("SG-004–014 inventory files exist on disk", () => {
    for (const relativePath of SYSTEM_GRAVITY_INVENTORY_RELATIVE_PATHS) {
      expect(existsSync(join(REPO_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("SG-015 compat matrix exists and names ADR 0098", () => {
    const matrixPath = join(REPO_ROOT, SYSTEM_GRAVITY_COMPAT_MATRIX_RELATIVE_PATH);

    expect(existsSync(matrixPath), SYSTEM_GRAVITY_COMPAT_MATRIX_RELATIVE_PATH).toBe(true);

    const matrix = readFileSync(matrixPath, "utf8");

    expect(matrix).toMatch(/0098/);
    expect(matrix).toMatch(/Instrument leftover/i);
  });
});
