import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { INHABIT_POST_DIAGNOSIS_SPECIALIST_HREF_ROWS } from "@/lib/inhabit-post-ir-leak-inventories";

const UI_ROOT = join(process.cwd(), "src");

describe("inhabit post-diagnosis specialist href guard (WA-002)", () => {
  it("routes Ask Open finding through inhabited inspect helper", () => {
    const source = readFileSync(join(UI_ROOT, "lib/ask-citation-action-follow-ups.ts"), "utf8");

    expect(source).toContain("resolveQuickDecisionFindingInspectHref");
    expect(source).not.toContain("getFindingDetailHref");
  });

  it("keeps WA-002 inventory rows closed", () => {
    expect(INHABIT_POST_DIAGNOSIS_SPECIALIST_HREF_ROWS.every((row) => row.ownerPrompt === "WA-002")).toBe(
      true,
    );
    expect(INHABIT_POST_DIAGNOSIS_SPECIALIST_HREF_ROWS.every((row) => !row.leakOpen)).toBe(true);
  });
});
