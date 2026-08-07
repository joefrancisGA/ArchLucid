import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthenticationSignInHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/AuthenticationSignInHelpEvidenceOrientationStrip";
import {
  AUTHENTICATION_SIGN_IN_HELP_CANONICAL_PATH,
  AUTHENTICATION_SIGN_IN_HELP_SOURCES,
} from "@/lib/authentication-sign-in-help-evidence-copy";

describe("AuthenticationSignInHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking authentication-sign-in help", () => {
    render(<AuthenticationSignInHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("authentication-sign-in-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("authentication-sign-in-help-claim-discipline")).toBeInTheDocument();

    for (const link of AUTHENTICATION_SIGN_IN_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      AUTHENTICATION_SIGN_IN_HELP_SOURCES.some(
        (link) => link.href === AUTHENTICATION_SIGN_IN_HELP_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});
