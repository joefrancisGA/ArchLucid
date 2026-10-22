import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { OPERATOR_BUTTON_VARIANT_COLOR_MATRIX } from "@/lib/design-tokens";

describe("button variant/color matrix contract (TB-2290)", () => {
  it("documents matrix in UI_DESIGN_SYSTEM.md", () => {
    const designSystem = readFileSync(
      join(process.cwd(), "..", "docs", "library", "UI_DESIGN_SYSTEM.md"),
      "utf8",
    );

    expect(designSystem).toContain("Button variant/color matrix (**TB-2290**");
    expect(designSystem).toContain("`archlucid-ui/src/components/ui/button.tsx`");
    expect(designSystem).toContain("**TB-1539**");
    expect(designSystem).toContain("**TB-2279**");
    expect(designSystem).toContain("**TB-2168**");
    expect(designSystem).toContain("**TB-2291**");
  });

  it("exports programmatic matrix mirror in design-tokens", () => {
    expect(OPERATOR_BUTTON_VARIANT_COLOR_MATRIX.canonicalSource).toContain("button.tsx");
    expect(OPERATOR_BUTTON_VARIANT_COLOR_MATRIX.variants).toContain("primary");
    expect(OPERATOR_BUTTON_VARIANT_COLOR_MATRIX.variants).toContain("outline");
    expect(OPERATOR_BUTTON_VARIANT_COLOR_MATRIX.bannedClassNamePrefixes).toContain("bg-teal-");
  });

  it("points button.tsx variants at the design-system contract", () => {
    const buttonSource = readFileSync(join(process.cwd(), "src", "components", "ui", "button.tsx"), "utf8");

    expect(buttonSource).toContain("TB-2290");
    expect(buttonSource).toContain("Button variant/color matrix");
  });
});
