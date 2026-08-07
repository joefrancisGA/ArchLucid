import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IdentityProvidersOidcEvidenceOrientationStrip } from "@/app/(operator)/administration/identity-providers/_sections/IdentityProvidersOidcEvidenceOrientationStrip";
import {
  IDENTITY_PROVIDERS_OIDC_CANONICAL_PATH,
  IDENTITY_PROVIDERS_OIDC_SOURCES,
} from "@/lib/identity-providers-oidc-evidence-copy";

describe("IdentityProvidersOidcEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking OIDC settings", () => {
    render(<IdentityProvidersOidcEvidenceOrientationStrip />);

    expect(screen.getByTestId("identity-providers-oidc-sources")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-oidc-claim-discipline")).toBeInTheDocument();

    for (const link of IDENTITY_PROVIDERS_OIDC_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      IDENTITY_PROVIDERS_OIDC_SOURCES.some((link) => link.href === IDENTITY_PROVIDERS_OIDC_CANONICAL_PATH),
    ).toBe(false);
  });
});
