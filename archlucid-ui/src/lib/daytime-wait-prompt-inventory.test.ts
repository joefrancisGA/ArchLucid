import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("daytime-wait prompt inventory (DW-024)", () => {
  it("includes the DW-00 index and DW-001 through DW-024 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("daytime-wait-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("daytime-wait-00-index.md");

    for (let promptNumber = 1; promptNumber <= 24; promptNumber += 1) {
      const prefixNum = `daytime-wait-${String(promptNumber).padStart(3, "0")}-`;
      const match = files.find((name) => name.startsWith(prefixNum));

      expect(match, `missing prompt file for DW-${String(promptNumber).padStart(3, "0")}`).toBeDefined();
    }

    expect(files.filter((name) => /^daytime-wait-\d{3}-/.test(name))).toHaveLength(24);
  });
});
