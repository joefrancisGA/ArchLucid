import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CaiqSigResponseHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/CaiqSigResponseHelpEvidenceOrientationStrip";
import {
  CAIQ_SIG_RESPONSE_HELP_CANONICAL_PATH,
  CAIQ_SIG_RESPONSE_HELP_SOURCES,
} from "@/lib/caiq-sig-response-help-evidence-copy";

describe("CaiqSigResponseHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking caiq-sig-response help", () => {
    render(<CaiqSigResponseHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("caiq-sig-response-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("caiq-sig-response-help-claim-discipline")).toBeInTheDocument();

    for (const link of CAIQ_SIG_RESPONSE_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      CAIQ_SIG_RESPONSE_HELP_SOURCES.some((link) => link.href === CAIQ_SIG_RESPONSE_HELP_CANONICAL_PATH),
    ).toBe(false);
  });
});
