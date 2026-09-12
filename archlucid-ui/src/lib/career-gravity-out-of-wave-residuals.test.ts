import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CAREER_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS,
  CAREER_GRAVITY_OUT_OF_WAVE_RESIDUALS_DOC_PATH,
} from "@/lib/career-gravity-out-of-wave-residuals";

const REPO_ROOT = join(process.cwd(), "..");

describe("career-gravity out-of-wave residuals (CG-098)", () => {
  it("documents in-app changelog as not shipped for close audit", () => {
    const markdown = readFileSync(join(REPO_ROOT, CAREER_GRAVITY_OUT_OF_WAVE_RESIDUALS_DOC_PATH), "utf8");
    const changelogRow = CAREER_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((row) => row.ownerPrompt === "CG-098");

    expect(changelogRow).toBeDefined();
    expect(changelogRow?.status).toBe("not-shipped");
    expect(changelogRow?.item.toLowerCase()).toContain("changelog");

    expect(markdown).toContain("CG-098");
    expect(markdown).toContain("Not shipped");
    expect(markdown).toContain("In-app changelog");
    expect(markdown).toContain("## Do not claim");
  });
});
