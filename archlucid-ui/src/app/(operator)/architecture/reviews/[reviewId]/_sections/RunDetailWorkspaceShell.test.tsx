import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  RunDetailWorkspaceDisclosureControls,
  RunDetailWorkspaceDisclosureProvider,
} from "./RunDetailWorkspaceShell";

describe("RunDetailWorkspaceDisclosureControls", () => {
  it("renders outline buttons only inside the disclosure provider", () => {
    const { container: outsideProvider } = render(<RunDetailWorkspaceDisclosureControls />);

    expect(outsideProvider).toBeEmptyDOMElement();

    render(
      <RunDetailWorkspaceDisclosureProvider>
        <details data-workspace-disclosure>
          <summary>Section A</summary>
        </details>
        <RunDetailWorkspaceDisclosureControls />
      </RunDetailWorkspaceDisclosureProvider>,
    );

    const expandButton = screen.getByRole("button", { name: "Expand all" });
    const collapseButton = screen.getByRole("button", { name: "Collapse all" });

    expect(expandButton).toHaveClass("border");
    expect(collapseButton).toHaveClass("border");

    const disclosure = document.querySelector<HTMLDetailsElement>("details[data-workspace-disclosure]");

    expect(disclosure?.open).toBe(false);

    fireEvent.click(expandButton);

    expect(disclosure?.open).toBe(true);

    fireEvent.click(collapseButton);

    expect(disclosure?.open).toBe(false);
  });
});
