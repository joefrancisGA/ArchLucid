import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const sectionsDir = join(import.meta.dirname);

/** Buyer-visible governance workflow sections — no CI/CD promote/promotion verbs (TB-510). */
describe("governance workflow buyer copy (TB-510)", () => {
  const sectionSources = readdirSync(sectionsDir)
    .filter((name) => name.endsWith(".tsx") && !name.includes(".test."))
    .map((name) => readFileSync(join(sectionsDir, name), "utf8"));

  it("avoids promote or promotion as standalone action verbs in section TSX string literals", () => {
    const stringLiteralPattern = /"[^"]*"/g;

    for (const source of sectionSources) {
      const literals = source.match(stringLiteralPattern) ?? [];

      for (const literal of literals) {
        const value = literal.slice(1, -1).toLowerCase();

        expect(value, literal).not.toMatch(/\bpromote\b/);
        expect(value, literal).not.toMatch(/\bpromotion\b/);
      }
    }
  });
});
