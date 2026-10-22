import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CorePilotHelpClosingPanel } from "@/app/(operator)/help/_sections/CorePilotHelpClosingPanel";
import { CORE_PILOT_HELP_CLAIM_DISCIPLINE } from "@/lib/core-pilot-help-evidence-copy";

describe("CorePilotHelpClosingPanel", () => {
  it("renders claim discipline verbatim", () => {
    render(<CorePilotHelpClosingPanel />);

    expect(screen.getByTestId("core-pilot-help-claim-discipline")).toHaveTextContent(
      CORE_PILOT_HELP_CLAIM_DISCIPLINE,
    );
  });

  it("stays a quiet footer note rather than a boxed callout", () => {
    render(<CorePilotHelpClosingPanel />);

    const closingPanel = screen.getByTestId("core-pilot-help-closing-panel");

    expect(closingPanel.className).not.toContain("amber");
    expect(closingPanel.className).toContain("border-t");
    expect(screen.queryByTestId("core-pilot-help-sources")).toBeNull();
  });
});
