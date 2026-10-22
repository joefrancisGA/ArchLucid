import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { TB_2288_MIGRATED_MODULES } from "@/lib/status-pill-migration-inventory";
import { findAdHocStatusPillClassViolations } from "@/lib/status-pill-drift-source-patterns";

const SRC_ROOT = join(process.cwd(), "src");

describe("TB-2288 status pill migration contract", () => {
  it.each(TB_2288_MIGRATED_MODULES)("module %s uses StatusTag instead of ad-hoc pills", (relativePath) => {
    const source = readFileSync(join(SRC_ROOT, ...relativePath.split("/")), "utf8");

    expect(source).toMatch(/StatusTag|BooleanStatusChip/);
    expect(findAdHocStatusPillClassViolations(source)).toEqual([]);
  });
});
