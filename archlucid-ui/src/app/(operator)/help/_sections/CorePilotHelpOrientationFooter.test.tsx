import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CorePilotHelpOrientationFooter } from "@/app/(operator)/help/_sections/CorePilotHelpOrientationFooter";
import { CORE_PILOT_HELP_CLAIM_DISCIPLINE } from "@/lib/core-pilot-help-evidence-copy";

describe("CorePilotHelpOrientationFooter", () => {
  it("renders claim discipline verbatim", () => {
    render(<CorePilotHelpOrientationFooter />);

    expect(screen.getByTestId("core-pilot-help-claim-discipline")).toHaveTextContent(
      CORE_PILOT_HELP_CLAIM_DISCIPLINE,
    );
  });

  it("stays a quiet footer note rather than a boxed callout", () => {
    render(<CorePilotHelpOrientationFooter />);

    const orientation = screen.getByTestId("core-pilot-help-orientation");

    expect(orientation.className).not.toContain("amber");
    expect(orientation.className).toContain("border-t");
    expect(screen.queryByTestId("core-pilot-help-sources")).toBeNull();
  });
});
