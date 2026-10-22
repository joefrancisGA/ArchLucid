import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  LIVELIHOOD_DENSITY_COPY_FORBIDDEN_SUBSTRING,
  LIVELIHOOD_DENSITY_COPY_GUARDED_RELATIVE_PATHS,
} from "./livelihood-density-copy-inventory";

const SRC_ROOT = join(process.cwd(), "src");

describe("livelihood-density-copy guard (LS-03)", () => {
  it("guarded customer copy files do not contain the advisory miss-clause sentence", () => {
    for (const relativePath of LIVELIHOOD_DENSITY_COPY_GUARDED_RELATIVE_PATHS) {
      const absolutePath = join(SRC_ROOT, relativePath);
      const contents = readFileSync(absolutePath, "utf8");

      expect(contents.toLowerCase()).not.toContain(LIVELIHOOD_DENSITY_COPY_FORBIDDEN_SUBSTRING);
    }
  });
});
