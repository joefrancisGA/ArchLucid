import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PilotGuideHelpEvidenceOrientationStrip } from "@/components/help/PilotGuideHelpEvidenceOrientationStrip";

describe("PilotGuideHelpEvidenceOrientationStrip", () => {
  it("suppresses claim discipline callout because help-pilot-guide is omitted (legacy strip id alias)", () => {
    render(<PilotGuideHelpEvidenceOrientationStrip />);

    expect(screen.queryByTestId("pilot-guide-help-claim-discipline")).not.toBeInTheDocument();
  });
});
