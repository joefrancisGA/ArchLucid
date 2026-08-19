import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("metadata chip taxonomy contract (TB-2284)", () => {
  it("documents taxonomy in UI_DESIGN_SYSTEM.md", () => {
    const designSystem = readFileSync(
      join(process.cwd(), "..", "docs", "library", "UI_DESIGN_SYSTEM.md"),
      "utf8",
    );

    expect(designSystem).toContain("Metadata chip taxonomy (**TB-2284**");
    expect(designSystem).toContain("**`StatusTag`**");
    expect(designSystem).toContain("**`FilterChip`**");
    expect(designSystem).toContain("**`StatusPill`** (deprecated)");
    expect(designSystem).toContain("**TB-116**");
    expect(designSystem).toContain("**TB-1646**");
    expect(designSystem).toContain("**TB-2277**");
  });

  it("marks StatusPill deprecated in source", () => {
    const statusPill = readFileSync(
      join(process.cwd(), "src", "components", "StatusPill.tsx"),
      "utf8",
    );

    expect(statusPill).toContain("@deprecated TB-2284");
    expect(statusPill).toContain("StatusTag");
  });
});
