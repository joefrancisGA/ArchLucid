import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthDomainsIdentityProvidersVocabularyRail } from "@/components/AuthDomainsIdentityProvidersVocabularyRail";
import {
  AUTH_DOMAINS_IDENTITY_PROVIDERS_COMPACT_LINE,
  AUTH_DOMAINS_IDENTITY_PROVIDERS_DOMAINS_LINK,
  AUTH_DOMAINS_IDENTITY_PROVIDERS_HEADING,
  AUTH_DOMAINS_IDENTITY_PROVIDERS_IDP_LINK,
  AUTH_DOMAINS_IDENTITY_PROVIDERS_WHY_TWO,
} from "@/lib/vocabulary/auth-domains-identity-providers-vocabulary";

describe("AuthDomainsIdentityProvidersVocabularyRail (TB-2299)", () => {
  it("renders auth-domains strip with peer link to identity providers", () => {
    render(<AuthDomainsIdentityProvidersVocabularyRail currentSurfaceId="auth-domains" />);

    const strip = screen.getByTestId("auth-domains-identity-providers-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "auth-domains");
    expect(strip.textContent ?? "").toContain(AUTH_DOMAINS_IDENTITY_PROVIDERS_COMPACT_LINE);

    const peer = screen.getByTestId("auth-domains-identity-providers-vocabulary-peer-link");
    expect(peer).toHaveTextContent(AUTH_DOMAINS_IDENTITY_PROVIDERS_IDP_LINK.label);
    expect(peer).toHaveAttribute("href", AUTH_DOMAINS_IDENTITY_PROVIDERS_IDP_LINK.href);
  });

  it("renders identity-providers strip with peer link to sign-in domains", () => {
    render(
      <AuthDomainsIdentityProvidersVocabularyRail currentSurfaceId="identity-providers" />,
    );

    const peer = screen.getByTestId("auth-domains-identity-providers-vocabulary-peer-link");
    expect(peer).toHaveTextContent(AUTH_DOMAINS_IDENTITY_PROVIDERS_DOMAINS_LINK.label);
    expect(peer).toHaveAttribute("href", AUTH_DOMAINS_IDENTITY_PROVIDERS_DOMAINS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <AuthDomainsIdentityProvidersVocabularyRail
        currentSurfaceId="auth-domains"
        variant="full"
      />,
    );

    expect(screen.getByText(AUTH_DOMAINS_IDENTITY_PROVIDERS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(AUTH_DOMAINS_IDENTITY_PROVIDERS_WHY_TWO)).toBeInTheDocument();
  });
});
