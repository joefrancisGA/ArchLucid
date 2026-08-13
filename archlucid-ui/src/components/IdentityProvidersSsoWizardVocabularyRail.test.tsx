import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IdentityProvidersSsoWizardVocabularyRail } from "@/components/IdentityProvidersSsoWizardVocabularyRail";
import {
  IDENTITY_PROVIDERS_SSO_WIZARD_COMPACT_LINE,
  IDENTITY_PROVIDERS_SSO_WIZARD_HEADING,
  IDENTITY_PROVIDERS_SSO_WIZARD_HUB_LINK,
  IDENTITY_PROVIDERS_SSO_WIZARD_WHY_TWO,
  IDENTITY_PROVIDERS_SSO_WIZARD_WIZARD_LINK,
} from "@/lib/vocabulary/identity-providers-sso-wizard-vocabulary";

describe("IdentityProvidersSsoWizardVocabularyRail (TB-2277)", () => {
  it("renders identity-providers strip with peer link to sso wizard", () => {
    render(<IdentityProvidersSsoWizardVocabularyRail currentSurfaceId="identity-providers" />);

    const strip = screen.getByTestId("identity-providers-sso-wizard-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "identity-providers");
    expect(strip.textContent ?? "").toContain(IDENTITY_PROVIDERS_SSO_WIZARD_COMPACT_LINE);

    const peer = screen.getByTestId("identity-providers-sso-wizard-vocabulary-peer-link");
    expect(peer).toHaveTextContent(IDENTITY_PROVIDERS_SSO_WIZARD_WIZARD_LINK.label);
    expect(peer).toHaveAttribute("href", IDENTITY_PROVIDERS_SSO_WIZARD_WIZARD_LINK.href);
  });

  it("renders sso-wizard strip with peer link to identity providers", () => {
    render(<IdentityProvidersSsoWizardVocabularyRail currentSurfaceId="sso-wizard" />);

    expect(screen.getByTestId("identity-providers-sso-wizard-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "sso-wizard",
    );

    const peer = screen.getByTestId("identity-providers-sso-wizard-vocabulary-peer-link");
    expect(peer).toHaveTextContent(IDENTITY_PROVIDERS_SSO_WIZARD_HUB_LINK.label);
    expect(peer).toHaveAttribute("href", IDENTITY_PROVIDERS_SSO_WIZARD_HUB_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <IdentityProvidersSsoWizardVocabularyRail
        currentSurfaceId="identity-providers"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("identity-providers-sso-wizard-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(IDENTITY_PROVIDERS_SSO_WIZARD_HEADING)).toBeInTheDocument();
    expect(screen.getByText(IDENTITY_PROVIDERS_SSO_WIZARD_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-sso-wizard-vocabulary-current")).toHaveTextContent(
      IDENTITY_PROVIDERS_SSO_WIZARD_HUB_LINK.label,
    );
  });
});
