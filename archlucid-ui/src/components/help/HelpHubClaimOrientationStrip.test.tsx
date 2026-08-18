import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  HELP_HUB_CLAIM_DISCIPLINE,
  HELP_HUB_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/help/help-hub-evidence-copy";

import { HelpHubClaimOrientationStrip } from "./HelpHubClaimOrientationStrip";

describe("HelpHubClaimOrientationStrip", () => {
  it("renders claim discipline heading and body", () => {
    render(<HelpHubClaimOrientationStrip />);

    expect(
      screen.getByRole("heading", { level: 2, name: HELP_HUB_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("help-hub-claim-discipline").textContent).toContain(
      HELP_HUB_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("help-hub-sources")).toBeInTheDocument();
  });
});
