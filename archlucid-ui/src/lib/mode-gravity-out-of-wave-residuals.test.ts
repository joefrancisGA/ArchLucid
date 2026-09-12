import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  MODE_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS,
  MODE_GRAVITY_OUT_OF_WAVE_RESIDUALS_DOC_PATH,
} from "@/lib/mode-gravity-out-of-wave-residuals";

const REPO_ROOT = join(process.cwd(), "..");

describe("mode-gravity out-of-wave residuals (MG-013 / MG-014)", () => {
  it("documents do not delete Guided and do not flip host Mode", () => {
    const markdown = readFileSync(join(REPO_ROOT, MODE_GRAVITY_OUT_OF_WAVE_RESIDUALS_DOC_PATH), "utf8");
    const guidedRow = MODE_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((row) => row.ownerPrompt === "MG-013");
    const hostModeRow = MODE_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((row) => row.ownerPrompt === "MG-014");

    expect(guidedRow).toBeDefined();
    expect(guidedRow?.status).toBe("not-shipped");
    expect(guidedRow?.item.toLowerCase()).toContain("guided");

    expect(hostModeRow).toBeDefined();
    expect(hostModeRow?.status).toBe("not-shipped");
    expect(hostModeRow?.notes).toContain("G-REAL-06");

    expect(markdown).toContain("MG-013");
    expect(markdown).toContain("MG-014");
    expect(markdown).toContain("## Do not claim");
  });
});
