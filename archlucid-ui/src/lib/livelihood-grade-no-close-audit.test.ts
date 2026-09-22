import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("livelihood-grade-no wave close audit (LN-040)", () => {
  it("documents acceptance markdown and README shipped status", () => {
    const acceptance = readFileSync(
      join(REPO_ROOT, "docs/architecture/LIVELIHOOD_GRADE_NO_ACCEPTANCE_2026-09-11.md"),
      "utf8",
    );
    const readme = readFileSync(join(REPO_ROOT, "docs/architecture/README.md"), "utf8");
    const prompts = readFileSync(
      join(REPO_ROOT, "docs/architecture/LIVELIHOOD_GRADE_NO_COMPOSER_PROMPTS.md"),
      "utf8",
    );

    expect(acceptance).toMatch(/Shipped/);
    expect(acceptance).toMatch(/Uncited hard cannot export/);
    expect(acceptance).toMatch(/## Do not claim/);
    expect(acceptance).toMatch(/Do not claim[\s\S]*insight density/i);
    expect(acceptance).toMatch(/G-REAL-06/);

    expect(readme).toMatch(/LIVELIHOOD_GRADE_NO_ACCEPTANCE_2026-09-11\.md/);
    expect(prompts).toMatch(/LIVELIHOOD_GRADE_NO_ACCEPTANCE_2026-09-11\.md/);
    expect(prompts).not.toMatch(/ready to run/i);
  });
});
