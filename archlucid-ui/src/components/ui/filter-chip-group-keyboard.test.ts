import { describe, expect, it } from "vitest";

import {
  collectFilterChipFocusables,
  focusFilterChipAtIndex,
} from "@/components/ui/filter-chip-group-keyboard";

describe("filter-chip-group-keyboard", () => {
  it("collects enabled links and buttons only", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <a href="/all">All</a>
      <button type="button" disabled>Disabled</button>
      <a href="/open">Open</a>
    `;

    const focusables = collectFilterChipFocusables(container);

    expect(focusables).toHaveLength(2);
    expect(focusables[0]?.textContent).toBe("All");
    expect(focusables[1]?.textContent).toBe("Open");
  });

  it("focuses the chip at the requested index", () => {
    const container = document.createElement("div");
    container.innerHTML = `<a href="/all">All</a><a href="/open">Open</a>`;
    document.body.appendChild(container);

    focusFilterChipAtIndex(container, 1);

    expect(document.activeElement?.textContent).toBe("Open");

    document.body.removeChild(container);
  });
});
