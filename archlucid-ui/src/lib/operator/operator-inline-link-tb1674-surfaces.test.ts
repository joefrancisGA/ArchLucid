import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  OPERATOR_INLINE_LINK_TB1674_MIGRATED_SURFACES,
  OPERATOR_INLINE_LINK_TB1675_RESIDUAL_HINTS,
} from "@/lib/operator/operator-inline-link-tb1674-surfaces";

const UI_ROOT = path.join(process.cwd(), "src");

function readUiSource(relativePath: string): string {
  return readFileSync(path.join(UI_ROOT, relativePath), "utf8");
}

describe("TB-1674 inline-link migration inventory", () => {
  it("lists unique migrated surface ids", () => {
    const ids = OPERATOR_INLINE_LINK_TB1674_MIGRATED_SURFACES.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("migrated modules exist and cite OPERATOR_LINK", () => {
    for (const row of OPERATOR_INLINE_LINK_TB1674_MIGRATED_SURFACES) {
      const source = readUiSource(row.modulePath);
      expect(source, row.id).toContain("OPERATOR_LINK");
    }
  });

  it("documents TB-1675 residual hints for follow-on Vitest guard", () => {
    expect(OPERATOR_INLINE_LINK_TB1675_RESIDUAL_HINTS.length).toBeGreaterThan(0);
    expect(OPERATOR_INLINE_LINK_TB1675_RESIDUAL_HINTS.join("\n")).toMatch(/TB-1675|TB-2170/);
  });
});
