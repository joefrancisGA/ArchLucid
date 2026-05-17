import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BuyerTitleHint } from "@/components/BuyerTitleHint";
import { TooltipProvider } from "@/components/ui/tooltip";

describe("BuyerTitleHint", () => {
  it("renders a trigger button with an aria-label derived from the hint text", () => {
    render(
      <TooltipProvider>
        <BuyerTitleHint text="Explain deliverables rows vs ZIP download." />
      </TooltipProvider>,
    );

    expect(
      screen.getByRole("button", {
        name: "About this section: Explain deliverables rows vs ZIP download.",
      }),
    ).toBeInTheDocument();
  });
});
