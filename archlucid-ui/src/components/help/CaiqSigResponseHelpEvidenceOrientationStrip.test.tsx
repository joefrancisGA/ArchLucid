import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  expectClaimDisciplineBandContent,
  expectClaimDisciplineHeading,
  expectFollowUpLink,
} from "@/lib/claim-discipline-test-helpers";

import { CaiqSigResponseHelpEvidenceOrientationStrip } from "@/components/help/CaiqSigResponseHelpEvidenceOrientationStrip";
import {
  CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING,
  CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE,
  CAIQ_SIG_RESPONSE_HELP_LEAD,
  CAIQ_SIG_RESPONSE_HELP_SOURCES,
} from "@/lib/caiq-sig-response-help-evidence-copy";

describe("CaiqSigResponseHelpEvidenceOrientationStrip", () => {
  it("renders lead strip, diligence links with when clauses, and no duplicate claim discipline", () => {
    render(<CaiqSigResponseHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("caiq-sig-response-help-lead")).toHaveTextContent(CAIQ_SIG_RESPONSE_HELP_LEAD);
    expectClaimDisciplineHeading(
      screen,
      "help-caiq-sig-response",
      CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING,
      "caiq-sig-response-help-claim-heading",
    );
    expectClaimDisciplineBandContent(
      screen,
      "help-caiq-sig-response",
      "caiq-sig-response-help-claim-discipline",
      CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE,
    );

    for (const link of CAIQ_SIG_RESPONSE_HELP_SOURCES) {
      expectFollowUpLink(screen, link);
      expect(screen.getByText(link.when)).toBeInTheDocument();
    }
  });
});
