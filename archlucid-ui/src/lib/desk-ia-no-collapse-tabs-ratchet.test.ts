import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { DESK_IA_NO_COLLAPSE_TABS_TEST_PATH } from "@/lib/desk-ia-no-collapse-tabs-ratchet";

const REPO_ROOT = join(process.cwd(), "..");

describe("desk-ia no-collapse tabs ratchet (DI-009)", () => {
  it("resolve-review-detail-visible-tabs keeps moreTabIds empty on Working", () => {
    const testSource = readFileSync(join(REPO_ROOT, DESK_IA_NO_COLLAPSE_TABS_TEST_PATH), "utf8");

    expect(testSource).toMatch(/moreTabIds\)\.toEqual\(\[\]\)/);
  });
});
