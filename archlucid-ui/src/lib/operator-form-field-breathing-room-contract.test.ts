import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  OPERATOR_FORM_CONTROL_DESCRIPTION_GAP_CLASS,
  OPERATOR_FORM_FIELD_HELPER_CLASS,
  OPERATOR_FORM_FIELD_STACK_CLASS,
} from "@/lib/design-tokens";

describe("operator form field breathing room contract (TB-2000)", () => {
  it("exports form-stack tokens for label → control → helper rhythm", () => {
    expect(OPERATOR_FORM_FIELD_STACK_CLASS).toContain("space-y-3");
    expect(OPERATOR_FORM_FIELD_HELPER_CLASS).toContain("leading-relaxed");
    expect(OPERATOR_FORM_CONTROL_DESCRIPTION_GAP_CLASS).toContain("gap-3");
  });

  it("documents breathing-room rules in UI_DESIGN_SYSTEM.md", () => {
    const designSystem = readFileSync(
      join(process.cwd(), "..", "docs", "library", "UI_DESIGN_SYSTEM.md"),
      "utf8",
    );

    expect(designSystem).toContain("Operator form and helper breathing room (TB-2000)");
    expect(designSystem).toContain("OPERATOR_FORM_FIELD_STACK_CLASS");
    expect(designSystem).toContain("OPERATOR_FORM_FIELD_HELPER_CLASS");
    expect(designSystem).toContain("Do not:");
  });
});
