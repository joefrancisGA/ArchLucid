import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpDrawerClaimOrientationStrip } from "./HelpDrawerClaimOrientationStrip";

describe("HelpDrawerClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<HelpDrawerClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("contextual-help-drawer-sources")).toBeInTheDocument();
  });
});
