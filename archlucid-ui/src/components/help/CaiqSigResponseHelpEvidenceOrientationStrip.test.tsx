import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CaiqSigResponseHelpEvidenceOrientationStrip } from "@/components/help/CaiqSigResponseHelpEvidenceOrientationStrip";
import {
  CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE,
  CAIQ_SIG_RESPONSE_HELP_SOURCES,
} from "@/lib/caiq-sig-response-help-evidence-copy";

describe("CaiqSigResponseHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and all five Sources links", () => {
    render(<CaiqSigResponseHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("caiq-sig-response-help-claim-discipline")).toHaveTextContent(
      CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE,
    );

    for (const link of CAIQ_SIG_RESPONSE_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
  });
});
