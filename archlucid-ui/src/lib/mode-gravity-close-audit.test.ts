import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("mode-gravity wave close audit (MG-024)", () => {
  it("documents acceptance markdown and README shipped status", () => {
    const acceptance = readFileSync(
      join(REPO_ROOT, "docs/architecture/MODE_GRAVITY_ACCEPTANCE_2026-09-11.md"),
      "utf8",
    );
    const readme = readFileSync(join(REPO_ROOT, "docs/architecture/README.md"), "utf8");
    const prompts = readFileSync(
      join(REPO_ROOT, "docs/architecture/MODE_GRAVITY_COMPOSER_PROMPTS.md"),
      "utf8",
    );

    expect(acceptance).toMatch(/Shipped/);
    expect(acceptance).toMatch(/eval chrome remains false/i);
    expect(acceptance).toMatch(/Guided\/demo\/trial still eval/i);
    expect(acceptance).toMatch(/Host `AgentExecution:Mode` default unchanged/);
    expect(acceptance).toMatch(/## Do not claim/);
    expect(acceptance).toMatch(/G-REAL-06/);
    expect(acceptance).toMatch(/Do not claim[\s\S]*Guided/i);

    expect(readme).toMatch(/MODE_GRAVITY_ACCEPTANCE_2026-09-11\.md/);
    expect(readme).toMatch(/shipped/i);

    expect(prompts).toMatch(/MODE_GRAVITY_ACCEPTANCE_2026-09-11\.md/);
    expect(prompts).not.toMatch(/ready to run/i);
  });
});
