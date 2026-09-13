import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS,
  SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUALS_DOC_PATH,
} from "@/lib/system-gravity-out-of-wave-residuals";

const REPO_ROOT = join(process.cwd(), "..");

describe("system-gravity out-of-wave residuals (SG-082+)", () => {
  it("SG-082: documents draft-to-draft Compare skip in markdown and ratchet rows", () => {
    const markdown = readFileSync(join(REPO_ROOT, SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUALS_DOC_PATH), "utf8");
    const compareRow = SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((row) => row.ownerPrompt === "SG-082");

    expect(compareRow?.item).toBe("Draft-to-draft Compare");
    expect(compareRow?.status).toBe("not-shipped");
    expect(markdown).toContain("SG-082");
    expect(markdown).toContain("Draft-to-draft Compare");
  });

  it("SG-111–118: records explicit wave skips without pretending shipped", () => {
    const ownerPrompts = SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.map((row) => row.ownerPrompt);

    expect(ownerPrompts).toEqual(
      expect.arrayContaining(["SG-111", "SG-112", "SG-113", "SG-114", "SG-115", "SG-116", "SG-117", "SG-118"]),
    );
  });
});
