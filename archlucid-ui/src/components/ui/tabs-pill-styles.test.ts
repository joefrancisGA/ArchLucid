import { describe, expect, it } from "vitest";

import { TABS_PILL_LIST_CLASS, tabsPillTriggerClass } from "@/components/ui/tabs-pill-styles";

describe("tabs-pill-styles", () => {
  it("exposes borderless wrapped list chrome", () => {
    expect(TABS_PILL_LIST_CLASS).toMatch(/border-0/);
    expect(TABS_PILL_LIST_CLASS).toMatch(/flex-wrap/);
  });

  it("matches Reviews hub filter chip shell for active and idle triggers", () => {
    expect(tabsPillTriggerClass(true)).toMatch(/rounded-full/);
    expect(tabsPillTriggerClass(true)).toMatch(/bg-neutral-100/);
    expect(tabsPillTriggerClass(false)).toMatch(/rounded-full/);
    expect(tabsPillTriggerClass(false)).toMatch(/bg-neutral-100/);
  });
});
