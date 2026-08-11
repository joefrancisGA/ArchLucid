import { describe, expect, it } from "vitest";

import { OPERATOR_SHELL_STICKY_TOP_CLASS } from "@/lib/design-tokens";
import {
  WIZARD_STICKY_PROGRESS_CLASS,
  WIZARD_STICKY_PROGRESS_TEST_ID,
} from "@/lib/wizard-sticky-progress";

describe("wizard-sticky-progress", () => {
  it("includes sticky positioning and operator shell top offset", () => {
    expect(WIZARD_STICKY_PROGRESS_CLASS).toContain("sticky");
    expect(WIZARD_STICKY_PROGRESS_CLASS).toContain(OPERATOR_SHELL_STICKY_TOP_CLASS);
    expect(WIZARD_STICKY_PROGRESS_CLASS).toContain("z-20");
  });

  it("exports a stable test id for sticky chrome", () => {
    expect(WIZARD_STICKY_PROGRESS_TEST_ID).toBe("wizard-sticky-progress");
  });
});