import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { contextualHelpTriggerAriaLabel } from "@/lib/contextual-help-content";

import { ContextualHelp } from "./ContextualHelp";

function renderContextualHelp(helpKey: string): HTMLButtonElement {
  render(<ContextualHelp helpKey={helpKey} />);

  return screen.getByLabelText(contextualHelpTriggerAriaLabel(helpKey)!) as HTMLButtonElement;
}

function queryPanel(): HTMLElement | null {
  return screen.queryByRole("dialog", { name: /contextual help/i });
}

describe("ContextualHelp", () => {
  it("uses a recognizable info trigger instead of a question-mark help icon", () => {
    const button = renderContextualHelp("commit-manifest");

    expect(button).toHaveAttribute("data-help-tooltip-trigger");
    expect(button).toHaveAttribute("data-help-tooltip-icon", "info");
    expect(button.querySelector("svg")).not.toBeNull();
    expect(button).toHaveClass("h-7", "w-7");
    expect(button.className).not.toMatch(/rounded-full/);
  });

  it("opens on press and closes on a second press", async () => {
    const button = renderContextualHelp("commit-manifest");

    expect(queryPanel()).toBeNull();

    act(() => {
      fireEvent.click(button);
    });

    expect(await screen.findByRole("dialog", { name: /contextual help/i })).toBeInTheDocument();
    expect(screen.getByText(/locks the finalized review record/i)).toBeInTheDocument();

    act(() => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(queryPanel()).toBeNull();
    });
  });

  it("does not open on hover, because the panel carries a focusable Learn more link", () => {
    const button = renderContextualHelp("governance-gate");

    act(() => {
      fireEvent.pointerOver(button);
      fireEvent.pointerEnter(button);
      fireEvent.mouseOver(button);
    });

    expect(queryPanel()).toBeNull();
  });

  it("uses role=dialog (not tooltip) so interactive help copy is announced as a panel", () => {
    const button = renderContextualHelp("commit-manifest");

    act(() => {
      fireEvent.click(button);
    });

    expect(screen.getByRole("dialog", { name: /contextual help/i })).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("associates the trigger with the help panel for assistive technology when open", async () => {
    const button = renderContextualHelp("governance-gate");

    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    expect(button).toHaveAttribute("aria-expanded", "false");

    act(() => {
      fireEvent.click(button);
    });

    const panel = await screen.findByRole("dialog", { name: /contextual help/i });

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveAttribute("aria-controls", panel.getAttribute("id") as string);
  });

  it("moves focus into the panel on open so the Learn more link is keyboard reachable", async () => {
    const button = renderContextualHelp("governance-gate");

    act(() => {
      fireEvent.click(button);
    });

    const panel = await screen.findByRole("dialog", { name: /contextual help/i });

    await waitFor(() => {
      expect(panel === document.activeElement || panel.contains(document.activeElement)).toBe(true);
    });

    expect(screen.getByRole("link", { name: /learn more/i })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const button = renderContextualHelp("governance-gate");

    act(() => {
      fireEvent.click(button);
    });

    await screen.findByRole("dialog", { name: /contextual help/i });

    act(() => {
      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    });

    await waitFor(() => {
      expect(queryPanel()).toBeNull();
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(button);
    });
  });

  it.each([
    ["commit-manifest", "/help/first-architecture-review#review-states"],
    ["governance-gate", "/help/governance-approval#governance-workflow"],
  ] as const)("routes the %s Learn more link to its in-app help topic", async (helpKey, href) => {
    const button = renderContextualHelp(helpKey);

    act(() => {
      fireEvent.click(button);
    });

    await screen.findByRole("dialog", { name: /contextual help/i });

    const link = screen.getByRole("link", { name: /learn more/i });

    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveAttribute("target", "_blank");
  });
});
