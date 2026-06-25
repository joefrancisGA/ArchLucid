import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoiDispositionTrainingTooltip } from "@/components/roi/RoiDispositionTrainingTooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ROI_DISPOSITION_TRAINING_TOOLTIP_LABEL } from "@/lib/roi-disposition-training-copy";

describe("RoiDispositionTrainingTooltip", () => {
  it("exposes disposition-aware ROI training help", () => {
    render(
      <TooltipProvider>
        <RoiDispositionTrainingTooltip />
      </TooltipProvider>,
    );

    expect(
      screen.getByRole("button", { name: `About ${ROI_DISPOSITION_TRAINING_TOOLTIP_LABEL}` }),
    ).toBeInTheDocument();
  });
});
