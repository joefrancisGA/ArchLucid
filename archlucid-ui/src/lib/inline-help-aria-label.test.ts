import { describe, expect, it } from "vitest";

import { inlineHelpAriaLabel } from "@/lib/inline-help-aria-label";

describe("inlineHelpAriaLabel", () => {
  it("prefixes subjects with Help:", () => {
    expect(inlineHelpAriaLabel("Executive ROI")).toBe("Help: Executive ROI");
    expect(inlineHelpAriaLabel("Pack type")).toBe("Help: Pack type");
  });

  it("does not double-prefix existing Help labels", () => {
    expect(inlineHelpAriaLabel("Help: Executive ROI")).toBe("Help: Executive ROI");
  });

  it("returns Help for empty subjects", () => {
    expect(inlineHelpAriaLabel("   ")).toBe("Help");
  });
});
