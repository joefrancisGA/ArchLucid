import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { OPERATOR_SHORT_HELPER_MEASURE_CLASS } from "@/lib/design-tokens";

describe("operator short helper measure contract (TB-2038)", () => {
  it("exports full-width measure token for short operator intros", () => {
    expect(OPERATOR_SHORT_HELPER_MEASURE_CLASS).toBe("max-w-none");
  });

  it("documents short-helper measure rules in UI_DESIGN_SYSTEM.md", () => {
    const designSystem = readFileSync(
      join(process.cwd(), "..", "docs", "library", "UI_DESIGN_SYSTEM.md"),
      "utf8",
    );

    expect(designSystem).toContain("Short operator helper and intro measure (TB-2038)");
    expect(designSystem).toContain("OPERATOR_SHORT_HELPER_MEASURE_CLASS");
    expect(designSystem).toContain("max-w-prose");
    expect(designSystem).toContain("TB-2039");
  });
});
