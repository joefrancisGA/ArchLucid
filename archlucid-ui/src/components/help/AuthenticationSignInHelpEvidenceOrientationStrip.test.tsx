import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthenticationSignInHelpEvidenceOrientationStrip } from "@/components/help/AuthenticationSignInHelpEvidenceOrientationStrip";
import {
  AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE,
  AUTHENTICATION_SIGN_IN_HELP_SOURCES,
} from "@/lib/authentication-sign-in-help-evidence-copy";
import { AUTHENTICATION_SIGN_IN_HELP_SSO_SETUP_LINK } from "@/lib/authentication-sign-in-help-related-topics";

describe("AuthenticationSignInHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and all Sources links", () => {
    render(<AuthenticationSignInHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("authentication-sign-in-help-claim-discipline")).toHaveTextContent(
      AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE,
    );

    for (const link of AUTHENTICATION_SIGN_IN_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(AUTHENTICATION_SIGN_IN_HELP_SOURCES).toHaveLength(2);
    expect(screen.queryByRole("link", { name: /enterprise onboarding/i })).toBeNull();
    expect(screen.getByRole("link", { name: AUTHENTICATION_SIGN_IN_HELP_SSO_SETUP_LINK.label })).toHaveAttribute(
      "href",
      AUTHENTICATION_SIGN_IN_HELP_SSO_SETUP_LINK.href,
    );
  });
});
