import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("system-not-job wave close audit (SN-040)", () => {
  it("documents acceptance markdown and README shipped status", () => {
    const acceptance = readFileSync(
      join(REPO_ROOT, "docs/architecture/SYSTEM_NOT_JOB_ACCEPTANCE_2026-09-11.md"),
      "utf8",
    );
    const readme = readFileSync(join(REPO_ROOT, "docs/architecture/README.md"), "utf8");
    const prompts = readFileSync(
      join(REPO_ROOT, "docs/architecture/SYSTEM_NOT_JOB_COMPOSER_PROMPTS.md"),
      "utf8",
    );

    expect(acceptance).toMatch(/Shipped/);
    expect(acceptance).toMatch(/Spawn-locked draft is not a writable Career editor/);
    expect(acceptance).toMatch(/Compare remains committed-manifest/);
    expect(acceptance).toMatch(/Kernels unmerged/);
    expect(acceptance).toMatch(/Working Home is not two peer/);
    expect(acceptance).toMatch(/## Do not claim/);
    expect(acceptance).toMatch(/Do not claim[\s\S]*insight density/i);
    expect(acceptance).toMatch(/G-REAL-06/);

    expect(readme).toMatch(/SYSTEM_NOT_JOB_ACCEPTANCE_2026-09-11\.md/);
    expect(readme).toMatch(/shipped/i);

    expect(prompts).toMatch(/SYSTEM_NOT_JOB_ACCEPTANCE_2026-09-11\.md/);
    expect(prompts).not.toMatch(/in progress \(SN-001/);
  });
});
