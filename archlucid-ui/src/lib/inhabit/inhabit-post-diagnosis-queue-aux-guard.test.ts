import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { INHABIT_POST_DIAGNOSIS_QUEUE_AUXILIARY_ROWS } from "@/lib/inhabit-post-ir-leak-inventories";

const UI_ROOT = join(process.cwd(), "src");

describe("inhabit post-diagnosis queue auxiliary guard (WA-001)", () => {
  it("routes continue-last through resolveGovernanceQueueAuxiliaryFindingHref", () => {
    const source = readFileSync(join(UI_ROOT, "lib/resolve-continue-last-governance-finding.ts"), "utf8");

    expect(source).toContain("resolveGovernanceQueueAuxiliaryFindingHref");
    expect(source).not.toContain("getFindingDetailHref");
  });

  it("keeps WA-001 inventory rows closed", () => {
    expect(INHABIT_POST_DIAGNOSIS_QUEUE_AUXILIARY_ROWS.every((row) => row.ownerPrompt === "WA-001")).toBe(
      true,
    );
    expect(INHABIT_POST_DIAGNOSIS_QUEUE_AUXILIARY_ROWS.every((row) => !row.leakOpen)).toBe(true);
  });
});
