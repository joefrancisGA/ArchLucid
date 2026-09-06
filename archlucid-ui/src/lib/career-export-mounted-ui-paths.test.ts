import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CAREER_EXPORT_HONESTY_MODULE_IMPORT,
  CAREER_EXPORT_HONESTY_REQUIRED_SYMBOLS,
  CAREER_EXPORT_MOUNTED_UI_PATHS,
} from "@/lib/career-export-mounted-ui-paths";

const SRC_ROOT = join(process.cwd(), "src");

function fileUsesCareerExportHonesty(contents: string): boolean {
  if (!contents.includes(CAREER_EXPORT_HONESTY_MODULE_IMPORT)) {
    return false;
  }

  return CAREER_EXPORT_HONESTY_REQUIRED_SYMBOLS.some((symbol) => contents.includes(symbol));
}

describe("career-export-mounted-ui-paths (PC-13)", () => {
  it("every mounted export path imports the shared career export honesty module", () => {
    for (const relativePath of CAREER_EXPORT_MOUNTED_UI_PATHS) {
      const absolutePath = join(SRC_ROOT, relativePath);
      const contents = readFileSync(absolutePath, "utf8");

      expect(fileUsesCareerExportHonesty(contents), relativePath).toBe(true);
    }
  });
});
