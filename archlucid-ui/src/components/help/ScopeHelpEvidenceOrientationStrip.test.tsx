import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScopeHelpEvidenceOrientationStrip } from "@/components/help/ScopeHelpEvidenceOrientationStrip";
import { SCOPE_HELP_CLAIM_DISCIPLINE } from "@/lib/scope-help-evidence-copy";

describe("ScopeHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline without a Sources list", () => {
    render(<ScopeHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("scope-help-claim-discipline")).toHaveTextContent(SCOPE_HELP_CLAIM_DISCIPLINE);
    expect(screen.queryByTestId("scope-help-sources")).not.toBeInTheDocument();
  });
});
