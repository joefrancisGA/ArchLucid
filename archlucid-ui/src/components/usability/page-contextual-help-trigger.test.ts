import { describe, expect, it } from "vitest";

import { PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME } from "@/components/usability/page-contextual-help-trigger";

describe("PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME", () => {
  it("uses the same 13px semibold label scale as canonical Button (TB-2290)", () => {
    expect(PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME).toContain("text-[13px]");
    expect(PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME).toContain("font-semibold");
    expect(PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME).not.toContain("font-normal");
    expect(PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME).not.toContain("font-medium");
  });
});
