import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  WORKING_SEAT_EVAL_LEAK_INVENTORY_DOC_PATH,
  WORKING_SEAT_EVAL_LEAK_PRIORITY_PATHS,
} from "@/lib/working-seat-eval-leak-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("working-seat eval leak inventory (WS-04)", () => {
  it("documents shrink-only priority paths in repo markdown", () => {
    const markdown = readFileSync(join(REPO_ROOT, WORKING_SEAT_EVAL_LEAK_INVENTORY_DOC_PATH), "utf8");

    for (const row of WORKING_SEAT_EVAL_LEAK_PRIORITY_PATHS) {
      expect(markdown).toContain(row.relativePath);
      expect(markdown).toContain(row.ownerPrompt);
    }
  });

  it("lists only existing source files as priority leaks", () => {
    const uiRoot = join(process.cwd(), "src");

    for (const row of WORKING_SEAT_EVAL_LEAK_PRIORITY_PATHS) {
      expect(() => readFileSync(join(uiRoot, row.relativePath), "utf8")).not.toThrow();
    }
  });
});
