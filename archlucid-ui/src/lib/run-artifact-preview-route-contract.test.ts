import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("run artifact preview route contract (TB-1821 / RER removed)", () => {
  it("does not ship a bookmark-only RER App Router redirect page", () => {
    const rerPage = join(
      process.cwd(),
      "src",
      "app",
      "(operator)",
      "architecture",
      "reviews",
      "[runId]",
      "artifacts",
      "[artifactId]",
      "page.tsx",
    );

    expect(existsSync(rerPage)).toBe(false);
  });
});
