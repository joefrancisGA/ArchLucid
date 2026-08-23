import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitecturesNewClaimOrientationStrip } from "./ArchitecturesNewClaimOrientationStrip";
import { ARCHITECTURES_NEW_CLAIM_DISCIPLINE } from "@/lib/architectures-new-evidence-copy";

describe("ArchitecturesNewClaimOrientationStrip", () => {
  it("renders a sources-only strip without claim discipline", () => {
    render(<ArchitecturesNewClaimOrientationStrip />);

    expect(screen.queryByTestId("architectures-new-claim-discipline")).toBeNull();
    expect(screen.queryByText(ARCHITECTURES_NEW_CLAIM_DISCIPLINE)).not.toBeInTheDocument();
  });
});
