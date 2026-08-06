import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecurityTrustHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/SecurityTrustHelpEvidenceOrientationStrip";
import {
  SECURITY_TRUST_HELP_CANONICAL_PATH,
  SECURITY_TRUST_HELP_SOURCES,
} from "@/lib/security-trust-help-evidence-copy";

describe("SecurityTrustHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking security-trust help", () => {
    render(<SecurityTrustHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("security-trust-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("security-trust-help-claim-discipline")).toBeInTheDocument();

    for (const link of SECURITY_TRUST_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SECURITY_TRUST_HELP_SOURCES.some((link) => link.href === SECURITY_TRUST_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
