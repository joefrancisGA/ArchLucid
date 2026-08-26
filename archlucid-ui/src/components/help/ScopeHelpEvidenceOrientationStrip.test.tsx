import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScopeHelpEvidenceOrientationStrip } from "@/components/help/ScopeHelpEvidenceOrientationStrip";

describe("ScopeHelpEvidenceOrientationStrip", () => {
  it("omits the in-band claim callout when the header strip owns claim discipline", () => {
    render(<ScopeHelpEvidenceOrientationStrip />);

    expect(screen.queryByTestId("scope-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scope-help-sources")).not.toBeInTheDocument();
  });
});
