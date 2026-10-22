import { createElement } from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useEnterpriseTableKeyboardNav } from "./use-enterprise-table-keyboard-nav";

function KeyboardNavHarness(props: { rowCount: number; onActivateRow: (index: number) => void }) {
  const nav = useEnterpriseTableKeyboardNav({
    rowCount: props.rowCount,
    onActivateRow: props.onActivateRow,
  });

  return createElement(
    "div",
    {
      tabIndex: 0,
      onKeyDown: nav.onTableKeyDown,
      "data-focused": nav.focusedRowIndex,
    },
    "table",
  );
}

describe("useEnterpriseTableKeyboardNav", () => {
  it("moves focus with j/k and activates on Enter", () => {
    const onActivateRow = vi.fn();
    const { getByText } = render(
      createElement(KeyboardNavHarness, { rowCount: 3, onActivateRow }),
    );
    const region = getByText("table");

    fireEvent.keyDown(region, { key: "j" });
    expect(region.getAttribute("data-focused")).toBe("1");

    fireEvent.keyDown(region, { key: "k" });
    expect(region.getAttribute("data-focused")).toBe("0");

    fireEvent.keyDown(region, { key: "Enter" });
    expect(onActivateRow).toHaveBeenCalledWith(0);
  });
});
