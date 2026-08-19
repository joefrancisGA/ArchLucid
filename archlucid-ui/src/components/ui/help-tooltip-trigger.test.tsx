import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpTooltipTrigger } from "@/components/ui/help-tooltip-trigger";

describe("HelpTooltipTrigger", () => {
  it("renders an info icon for contextual explanations with a 28px hit target", () => {
    render(<HelpTooltipTrigger aria-label="Help: workspace scope" size="contextual" icon="info" />);

    const trigger = screen.getByRole("button", { name: "Help: workspace scope" });

    expect(trigger).toHaveAttribute("data-help-tooltip-trigger");
    expect(trigger).toHaveAttribute("data-help-tooltip-icon", "info");
    expect(trigger).toHaveClass("inline-flex", "h-7", "w-7");
    expect(trigger.className).not.toMatch(/rounded-full/);
    expect(trigger.querySelector("svg")).not.toBeNull();
    expect(trigger.querySelector("svg")?.classList.toString()).toMatch(/15px/);
    expect(trigger.textContent?.trim()).toBe("");
  });

  it("renders a help icon for toolbar support affordances with a 28px hit target", () => {
    render(
      <HelpTooltipTrigger
        aria-label="Help (F1)"
        size="toolbar"
        icon="help"
        data-testid="toolbar-help"
      />,
    );

    const trigger = screen.getByTestId("toolbar-help");

    expect(trigger).toHaveAttribute("data-help-tooltip-icon", "help");
    expect(trigger).toHaveClass("h-7", "w-7");
    expect(trigger.querySelector("svg")?.classList.toString()).toMatch(/18px/);
  });
});
