import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PilotRoiModelHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/PilotRoiModelHelpEvidenceOrientationStrip";
import {
  PILOT_ROI_MODEL_HELP_CANONICAL_PATH,
  PILOT_ROI_MODEL_HELP_SOURCES,
} from "@/lib/pilot-roi-model-help-evidence-copy";

describe("PilotRoiModelHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking pilot-roi-model help", () => {
    render(<PilotRoiModelHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("pilot-roi-model-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-roi-model-help-claim-discipline")).toBeInTheDocument();

    for (const link of PILOT_ROI_MODEL_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      PILOT_ROI_MODEL_HELP_SOURCES.some(
        (link) => link.href === PILOT_ROI_MODEL_HELP_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});
