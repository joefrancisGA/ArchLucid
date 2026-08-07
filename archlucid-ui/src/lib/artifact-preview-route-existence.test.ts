import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("artifact preview App Router existence (TB-1825 / MAM / RER)", () => {
  it("has physical pages for manifest-scoped and run-scoped artifact preview entry points", () => {
    const appRoot = join(process.cwd(), "src", "app", "(operator)");
    const mamPage = join(
      appRoot,
      "governance",
      "signed-records",
      "[manifestId]",
      "artifacts",
      "[artifactId]",
      "page.tsx",
    );
    const rerPage = join(
      appRoot,
      "architecture",
      "reviews",
      "[runId]",
      "artifacts",
      "[artifactId]",
      "page.tsx",
    );

    expect(existsSync(mamPage)).toBe(true);
    expect(existsSync(rerPage)).toBe(true);
  });
});
