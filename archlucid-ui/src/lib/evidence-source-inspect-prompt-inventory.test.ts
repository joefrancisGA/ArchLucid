import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("evidence-source-inspect prompt inventory (ESI-08)", () => {
  it("includes the ESI-00 index and ESI-01 through ESI-08 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("evidence-source-inspect-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("evidence-source-inspect-00-index.md");

    for (let promptNumber = 1; promptNumber <= 8; promptNumber += 1) {
      const prefixNum = `evidence-source-inspect-${String(promptNumber).padStart(2, "0")}-`;
      const match = files.find((name) => name.startsWith(prefixNum));

      expect(match, `missing prompt file for ESI-${String(promptNumber).padStart(2, "0")}`).toBeDefined();
    }

    const numberedPrompts = files.filter(
      (name) => /^evidence-source-inspect-\d{2}-/.test(name) && !name.includes("-00-"),
    );

    expect(numberedPrompts).toHaveLength(8);
  });
});
