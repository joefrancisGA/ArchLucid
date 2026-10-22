import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HELP_HUB_FOLLOW_UPS_TITLE } from "@/lib/help/help-hub-evidence-copy";
import { HelpHubClaimOrientationStrip } from "./HelpHubClaimOrientationStrip";

describe("HelpHubClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<HelpHubClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("help-hub-sources")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: HELP_HUB_FOLLOW_UPS_TITLE })).toBeInTheDocument();
  });
});
