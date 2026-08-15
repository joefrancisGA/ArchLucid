import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("artifact preview App Router existence (TB-1825 / TB-1950 / GAR / RER)", () => {
  it("has the manifest-scoped artifact preview page and no run-scoped bookmark redirect", () => {
    const appRoot = join(process.cwd(), "src", "app", "(operator)");
    const garPage = join(
      appRoot,
      "governance",
      "sealed-records",
      "[manifestId]",
      "artifacts",
      "[artifactId]",
      "page.tsx",
    );
    const rerPage = join(
      appRoot,
      "architecture",
      "reviews",
      "[reviewId]",
      "artifacts",
      "[artifactId]",
      "page.tsx",
    );

    expect(existsSync(garPage)).toBe(true);
    expect(existsSync(rerPage)).toBe(false);
  });
});
