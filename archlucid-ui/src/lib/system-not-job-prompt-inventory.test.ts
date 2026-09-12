import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("system-not-job prompt inventory (SN-037)", () => {
  it("includes the SN-00 index and SN-001 through SN-040 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("system-not-job-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("system-not-job-00-index.md");

    for (let promptNumber = 1; promptNumber <= 40; promptNumber += 1) {
      const prefixNum = `system-not-job-${String(promptNumber).padStart(3, "0")}-`;
      const match = files.find((name) => name.startsWith(prefixNum));

      expect(match, `missing prompt file for SN-${String(promptNumber).padStart(3, "0")}`).toBeDefined();
    }

    expect(files.filter((name) => /^system-not-job-\d{3}-/.test(name))).toHaveLength(40);
  });
});
