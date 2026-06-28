import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

describe("TooltipContent", () => {
  it("uses inverse tooltip surface tokens instead of page caption colors", () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip open>
          <TooltipTrigger asChild>
            <button type="button">Trigger</button>
          </TooltipTrigger>
          <TooltipContent data-testid="tooltip-content">Readable tooltip body</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const content = screen.getByTestId("tooltip-content");

    expect(content.className).toContain("bg-[var(--al-tooltip-bg)]");
    expect(content.className).toContain("text-[var(--al-tooltip-fg)]");
    expect(content.className).not.toContain("text-al-text-secondary");
    expect(content.className).not.toContain("text-al-text-primary");
  });
});
