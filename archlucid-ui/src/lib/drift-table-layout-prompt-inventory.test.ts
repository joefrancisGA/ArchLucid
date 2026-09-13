import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("drift-table-layout prompt inventory (IE-DT-03)", () => {
  it("includes the IE-DT-00 index and IE-DT-01 through IE-DT-04 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("drift-table-layout-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("drift-table-layout-00-index.md");

    for (let promptNumber = 1; promptNumber <= 4; promptNumber += 1) {
      const prefix = `drift-table-layout-0${promptNumber}-`;
      const match = files.find((name) => name.startsWith(prefix));

      expect(match, `missing prompt file for IE-DT-0${promptNumber}`).toBeDefined();
    }

    expect(files.filter((name) => /^drift-table-layout-0[1-4]-/.test(name))).toHaveLength(4);
  });
});
