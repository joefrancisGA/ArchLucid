import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoiDispositionTrainingTooltip } from "@/components/roi/RoiDispositionTrainingTooltip";
import { TooltipProvider } from "@/components/ui/tooltip";

describe("RoiDispositionTrainingTooltip", () => {
  it("exposes disposition-aware ROI training help", () => {
    render(
      <TooltipProvider>
        <RoiDispositionTrainingTooltip />
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: "Help: Sponsor ROI" })).toBeInTheDocument();
  });
});
