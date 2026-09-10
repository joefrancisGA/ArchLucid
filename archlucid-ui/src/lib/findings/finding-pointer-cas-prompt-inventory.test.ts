import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("finding-pointer CAS prompt inventory (FP-24)", () => {
  it("includes the FP-00 index and FP-01 through FP-24 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("finding-pointer-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("finding-pointer-00-index.md");

    for (let promptNumber = 1; promptNumber <= 24; promptNumber += 1) {
      const prefix = `finding-pointer-${String(promptNumber).padStart(2, "0")}-`;
      const match = files.find((name) => name.startsWith(prefix));

      expect(match, `missing prompt file for FP-${String(promptNumber).padStart(2, "0")}`).toBeDefined();
    }

    expect(files.filter((name) => /^finding-pointer-\d{2}-/.test(name))).toHaveLength(25);
  });
});
