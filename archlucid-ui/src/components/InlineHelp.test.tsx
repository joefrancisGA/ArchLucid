import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InlineHelp } from "@/components/InlineHelp";
import { TooltipProvider } from "@/components/ui/tooltip";

describe("InlineHelp", () => {
  it("renders a keyboard-accessible help trigger with a 28px hit target", () => {
    render(
      <TooltipProvider>
        <InlineHelp label="Sponsor ROI" hint="Disposition-aware savings basis." />
      </TooltipProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Help: Sponsor ROI" });

    expect(trigger).toHaveAttribute("data-help-tooltip-trigger");
    expect(trigger).toHaveAttribute("data-help-tooltip-icon", "info");
    expect(trigger).toHaveClass("h-7", "w-7");
    expect(trigger.querySelector("svg")?.classList.toString()).toMatch(/15px/);
  });
});
