import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccountSecurityAuthDomainsVocabularyRail } from "@/components/AccountSecurityAuthDomainsVocabularyRail";
import {
  ACCOUNT_SECURITY_AUTH_DOMAINS_COMPACT_LINE,
  ACCOUNT_SECURITY_AUTH_DOMAINS_DOMAINS_LINK,
  ACCOUNT_SECURITY_AUTH_DOMAINS_HEADING,
  ACCOUNT_SECURITY_AUTH_DOMAINS_SECURITY_LINK,
  ACCOUNT_SECURITY_AUTH_DOMAINS_WHY_TWO,
} from "@/lib/vocabulary/account-security-auth-domains-vocabulary";

describe("AccountSecurityAuthDomainsVocabularyRail (TB-2293)", () => {
  it("renders account-security strip with peer link to sign-in domains", () => {
    render(<AccountSecurityAuthDomainsVocabularyRail currentSurfaceId="account-security" />);

    const strip = screen.getByTestId("account-security-auth-domains-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "account-security");
    expect(strip.textContent ?? "").toContain(ACCOUNT_SECURITY_AUTH_DOMAINS_COMPACT_LINE);

    const peer = screen.getByTestId("account-security-auth-domains-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ACCOUNT_SECURITY_AUTH_DOMAINS_DOMAINS_LINK.label);
    expect(peer).toHaveAttribute("href", ACCOUNT_SECURITY_AUTH_DOMAINS_DOMAINS_LINK.href);
  });

  it("renders auth-domains strip with peer link to account security", () => {
    render(<AccountSecurityAuthDomainsVocabularyRail currentSurfaceId="auth-domains" />);

    const peer = screen.getByTestId("account-security-auth-domains-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ACCOUNT_SECURITY_AUTH_DOMAINS_SECURITY_LINK.label);
    expect(peer).toHaveAttribute("href", ACCOUNT_SECURITY_AUTH_DOMAINS_SECURITY_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <AccountSecurityAuthDomainsVocabularyRail currentSurfaceId="account-security" variant="full" />,
    );

    expect(screen.getByText(ACCOUNT_SECURITY_AUTH_DOMAINS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ACCOUNT_SECURITY_AUTH_DOMAINS_WHY_TWO)).toBeInTheDocument();
  });
});
