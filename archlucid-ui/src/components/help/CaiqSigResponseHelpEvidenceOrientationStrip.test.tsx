import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { CaiqSigResponseHelpEvidenceOrientationStrip } from "@/components/help/CaiqSigResponseHelpEvidenceOrientationStrip";
import {
  CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING,
  CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE,
  CAIQ_SIG_RESPONSE_HELP_LEAD,
  CAIQ_SIG_RESPONSE_HELP_SOURCES,
} from "@/lib/caiq-sig-response-help-evidence-copy";

describe("CaiqSigResponseHelpEvidenceOrientationStrip", () => {
  it("renders lead strip, claim discipline heading, and all diligence links with when clauses", () => {
    render(<CaiqSigResponseHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("caiq-sig-response-help-lead")).toHaveTextContent(CAIQ_SIG_RESPONSE_HELP_LEAD);
    expect(screen.getByRole("heading", { name: CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("caiq-sig-response-help-claim-discipline")).toHaveTextContent(
      CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE,
    );

    for (const link of CAIQ_SIG_RESPONSE_HELP_SOURCES) {
      expectFollowUpLink(screen, link);
      expect(screen.getByText(link.when)).toBeInTheDocument();
    }
  });
});
