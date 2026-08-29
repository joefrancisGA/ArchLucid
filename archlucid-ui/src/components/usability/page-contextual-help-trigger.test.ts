import { describe, expect, it } from "vitest";

import { PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME } from "@/components/usability/page-contextual-help-trigger";

describe("PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME", () => {
  it("uses the same 11px bold label scale as canonical Button (TB-2290)", () => {
    expect(PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME).toContain("text-[11px]");
    expect(PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME).toContain("font-bold");
    expect(PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME).not.toContain("font-normal");
    expect(PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME).not.toContain("font-medium");
  });
});
