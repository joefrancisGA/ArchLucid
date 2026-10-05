import { describe, expect, it } from "vitest";

import { DIAGRAM_RECONCILE_WORKBENCH_PAGE_SHORTCUTS } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-page-shortcuts";

const COMMON_BROWSER_COMBOS = ["ctrl+shift+r", "ctrl+shift+n", "ctrl+shift+t"];

describe("infra-evidence-diagram-reconcile-page-shortcuts", () => {
  it("does not register browser-reserved reconcile chords", () => {
    const keys = DIAGRAM_RECONCILE_WORKBENCH_PAGE_SHORTCUTS.map((entry) => entry.key.toLowerCase());

    for (const browserCombo of COMMON_BROWSER_COMBOS) {
      expect(keys).not.toContain(browserCombo);
    }

    expect(keys).toContain("alt+shift+r");
  });
});
