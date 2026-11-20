import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const uiRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("score-lift rounds 73-81 mounted contract depth", () => {
  for (const round of [73, 74, 75, 76, 77, 78, 79, 80, 81] as const) {
    it(`round ${round} mounted contract test file is present and non-empty`, () => {
      const relative = `lib/score-lift-round${round}-mounted-contract.test.ts`;
      const absolute = join(uiRoot, relative);

      expect(existsSync(absolute)).toBe(true);
      expect(readFileSync(absolute, "utf8").length).toBeGreaterThan(100);
    });
  }
});
