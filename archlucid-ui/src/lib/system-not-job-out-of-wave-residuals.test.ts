import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUAL_ROWS,
  SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUALS_DOC_PATH,
} from "@/lib/system-not-job-out-of-wave-residuals";

const REPO_ROOT = join(process.cwd(), "..");

describe("system-not-job out-of-wave residuals (SN-038 / SN-039)", () => {
  it("documents draft-diff Compare as not shipped (SN-038)", () => {
    const markdown = readFileSync(join(REPO_ROOT, SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUALS_DOC_PATH), "utf8");
    const compareRow = SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUAL_ROWS.find((row) => row.ownerPrompt === "SN-038");

    expect(compareRow).toBeDefined();
    expect(compareRow?.status).toBe("not-shipped");
    expect(compareRow?.item.toLowerCase()).toContain("compare");

    expect(markdown).toContain("SN-038");
    expect(markdown).toContain("Not shipped");
    expect(markdown).toMatch(/draft-to-draft/i);
    expect(markdown).toContain("SN-014");
    expect(markdown).toContain("## Do not claim");
  });

  it("documents live presence as not shipped (SN-039)", () => {
    const markdown = readFileSync(join(REPO_ROOT, SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUALS_DOC_PATH), "utf8");
    const presenceRow = SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUAL_ROWS.find((row) => row.ownerPrompt === "SN-039");

    expect(presenceRow).toBeDefined();
    expect(presenceRow?.status).toBe("not-shipped");
    expect(presenceRow?.item.toLowerCase()).toContain("presence");

    expect(markdown).toContain("SN-039");
    expect(markdown).toContain("LW-089");
    expect(markdown).toContain("Collab strip");
    expect(markdown).toMatch(/live presence[\s\S]*not shipped/i);
  });
});
