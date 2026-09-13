import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MUTATION_UNDO_WINDOW_SECONDS } from "@/lib/mutation-reversibility-registry";
import {
  LIVELIHOOD_DAY_OUT_OF_WAVE_RESIDUAL_ROWS,
  LIVELIHOOD_DAY_OUT_OF_WAVE_RESIDUALS_DOC_PATH,
} from "@/lib/livelihood-day-out-of-wave-residuals";

const REPO_ROOT = join(process.cwd(), "..");

describe("livelihood-day out-of-wave residuals (LY-043 / 046 / 058 / 059 / 116–118)", () => {
  it("records G-REAL-06, draft-diff, presence, chat, and 300s undo as skips", () => {
    const items = LIVELIHOOD_DAY_OUT_OF_WAVE_RESIDUAL_ROWS.map((row) => row.item);
    const prompts = LIVELIHOOD_DAY_OUT_OF_WAVE_RESIDUAL_ROWS.map((row) => row.ownerPrompt);

    expect(items.some((item) => item.toLowerCase().includes("g-real-06"))).toBe(true);
    expect(items.some((item) => item.toLowerCase().includes("compare"))).toBe(true);
    expect(items.some((item) => item.toLowerCase().includes("presence"))).toBe(true);
    expect(items.some((item) => item.toLowerCase().includes("chat"))).toBe(true);
    expect(items.some((item) => item.includes("300"))).toBe(true);
    expect(prompts).toContain("LY-116");
    expect(prompts).toContain("LY-117");
    expect(prompts).toContain("LY-118");
    expect(prompts).toContain("LY-043");
    expect(MUTATION_UNDO_WINDOW_SECONDS).toBe(300);
  });

  it("documents residuals markdown for close audit", () => {
    const doc = readFileSync(join(REPO_ROOT, LIVELIHOOD_DAY_OUT_OF_WAVE_RESIDUALS_DOC_PATH), "utf8");

    expect(doc).toMatch(/LY-116/);
    expect(doc).toMatch(/draft-to-draft/i);
    expect(doc).toMatch(/EnableLlmJudgeOnFinalize/);
    expect(doc).toContain("## Do not claim");
  });
});
