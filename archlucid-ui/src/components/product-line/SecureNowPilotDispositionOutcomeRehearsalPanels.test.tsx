import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowPilotDispositionOutcomeRehearsalPanels } from "./SecureNowPilotDispositionOutcomeRehearsalPanels";

describe("SecureNowPilotDispositionOutcomeRehearsalPanels", () => {
  it("shows Proceed commercial links when Proceed is selected", () => {
    render(
      <SecureNowPilotDispositionOutcomeRehearsalPanels
        outcome="Proceed"
        savedOutcome={null}
        savedRationale={null}
        pathId="path-1"
        testIdPrefix="securenow-sponsor-path"
        stopHandoffTestId="stop-handoff"
      />,
    );

    expect(screen.getByTestId("securenow-sponsor-path-proceed-commercial")).toBeInTheDocument();
  });
});
