import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { contextualHelpTriggerAriaLabel } from "@/lib/contextual-help-content";

import { ContextualHelp } from "./ContextualHelp";

describe("ContextualHelp", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses a recognizable info trigger instead of a question-mark help icon", () => {
    render(<ContextualHelp helpKey="commit-manifest" />);

    const button = screen.getByLabelText(contextualHelpTriggerAriaLabel("commit-manifest")!);

    expect(button).toHaveAttribute("data-help-tooltip-trigger");
    expect(button).toHaveAttribute("data-help-tooltip-icon", "info");
    expect(button.querySelector("svg")).not.toBeNull();
    expect(button).toHaveClass("h-7", "w-7");
    expect(button.className).not.toMatch(/rounded-full/);
  });

  it("renders tooltip on click and toggles on second click", async () => {
    const { getByLabelText, queryByRole, getByText } = render(
      <ContextualHelp helpKey="commit-manifest" />,
    );

    const button = getByLabelText(contextualHelpTriggerAriaLabel("commit-manifest")!);
    expect(queryByRole("region", { name: /contextual help/i })).toBeNull();

    act(() => {
      fireEvent.click(button);
    });

    expect(await screen.findByRole("region", { name: /contextual help/i })).toBeInTheDocument();
    expect(getByText(/versioned, reviewed decision record/i)).toBeInTheDocument();

    act(() => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: /contextual help/i })).toBeNull();
    });
  });

  it("uses role=region (not tooltip) when learn-more link is present", () => {
    render(<ContextualHelp helpKey="commit-manifest" />);
    const button = screen.getByLabelText(contextualHelpTriggerAriaLabel("commit-manifest")!);

    act(() => {
      fireEvent.click(button);
    });

    expect(screen.getByRole("region", { name: /contextual help/i })).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("renders learn-more link when the entry defines learnMoreUrl", () => {
    render(<ContextualHelp helpKey="commit-manifest" />);
    const button = screen.getByLabelText(contextualHelpTriggerAriaLabel("commit-manifest")!);

    act(() => {
      fireEvent.click(button);
    });

    const more = screen.getByRole("link", { name: /learn more/i });
    expect(more.getAttribute("href")).toBe("/help/core-pilot#commit");
    expect(more).toHaveAttribute("target", "_blank");
  });

  it("associates the trigger with the help panel for assistive technology when open", () => {
    const { getByLabelText, getByRole } = render(<ContextualHelp helpKey="governance-gate" />);
    const button = getByLabelText(contextualHelpTriggerAriaLabel("governance-gate")!);

    act(() => {
      fireEvent.click(button);
    });

    const panel = getByRole("region", { name: /contextual help/i });
    const tid = panel.getAttribute("id");

    expect(tid).toBeTruthy();
    expect(button).toHaveAttribute("aria-describedby", tid as string);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveAttribute("aria-controls", tid as string);
  });

  it.each([" ", "Enter"] as const)("is keyboard accessible: %s toggles the help panel", (key) => {
    const { getByLabelText, queryByRole, unmount } = render(<ContextualHelp helpKey="governance-gate" />);
    const label = contextualHelpTriggerAriaLabel("governance-gate");

    expect(label).not.toBeNull();

    const button = getByLabelText(label!) as HTMLButtonElement;

    act(() => {
      button.focus();
      fireEvent.keyDown(button, { key, code: key === " " ? "Space" : "Enter" });
    });

    expect(queryByRole("region", { name: /contextual help/i })).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(button, { key, code: key === " " ? "Space" : "Enter" });
    });

    expect(queryByRole("region", { name: /contextual help/i })).toBeNull();
    unmount();
  });
});
