import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IdentityProvidersSamlEvidenceOrientationStrip } from "@/app/(operator)/administration/identity-providers/_sections/IdentityProvidersSamlEvidenceOrientationStrip";
import {
  IDENTITY_PROVIDERS_SAML_CANONICAL_PATH,
  IDENTITY_PROVIDERS_SAML_SOURCES,
} from "@/lib/identity-providers-saml-evidence-copy";

describe("IdentityProvidersSamlEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking SAML settings", () => {
    render(<IdentityProvidersSamlEvidenceOrientationStrip />);

    expect(screen.getByTestId("identity-providers-saml-sources")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-saml-claim-discipline")).toBeInTheDocument();

    for (const link of IDENTITY_PROVIDERS_SAML_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      IDENTITY_PROVIDERS_SAML_SOURCES.some((link) => link.href === IDENTITY_PROVIDERS_SAML_CANONICAL_PATH),
    ).toBe(false);
  });
});
