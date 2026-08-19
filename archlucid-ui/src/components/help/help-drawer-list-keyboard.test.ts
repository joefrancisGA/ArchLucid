import { describe, expect, it } from "vitest";

import { focusHelpDrawerRow } from "@/components/help/help-drawer-list-keyboard";

describe("focusHelpDrawerRow", () => {
  it("focuses the first actionable row", () => {
    const root = document.createElement("div");
    const first = document.createElement("button");
    const second = document.createElement("button");

    first.setAttribute("data-help-drawer-row", "");
    second.setAttribute("data-help-drawer-row", "");
    root.append(first, second);
    document.body.append(root);

    focusHelpDrawerRow(root, "first");

    expect(document.activeElement).toBe(first);

    root.remove();
  });
});
