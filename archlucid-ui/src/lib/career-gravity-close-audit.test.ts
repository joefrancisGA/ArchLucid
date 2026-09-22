import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("career-gravity wave close audit (CG-100)", () => {
  it("documents acceptance markdown and README shipped status", () => {
    const acceptance = readFileSync(
      join(REPO_ROOT, "docs/architecture/CAREER_GRAVITY_ACCEPTANCE_2026-09-11.md"),
      "utf8",
    );
    const readme = readFileSync(join(REPO_ROOT, "docs/architecture/README.md"), "utf8");
    const prompts = readFileSync(
      join(REPO_ROOT, "docs/architecture/CAREER_GRAVITY_COMPOSER_PROMPTS.md"),
      "utf8",
    );

    expect(acceptance).toMatch(/Shipped/);
    expect(acceptance).toMatch(/Career \+ Simulator cannot finalize/);
    expect(acceptance).toMatch(/Guided\/demo\/trial still teach Simulator/);
    expect(acceptance).toMatch(/Host `AgentExecution:Mode` default unchanged/);
    expect(acceptance).toMatch(/## Do not claim/);
    expect(acceptance).toMatch(/Do not claim[\s\S]*insight density/i);
    expect(acceptance).toMatch(/G-REAL-06/);

    expect(readme).toMatch(/CAREER_GRAVITY_ACCEPTANCE_2026-09-11\.md/);
    expect(readme).toMatch(/shipped/i);

    expect(prompts).toMatch(/CAREER_GRAVITY_ACCEPTANCE_2026-09-11\.md/);
    expect(prompts).not.toMatch(/ready to run/i);
  });
});
