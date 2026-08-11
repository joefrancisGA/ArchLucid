import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrustAssuranceSecurityTrustVocabularyRail } from "@/components/TrustAssuranceSecurityTrustVocabularyRail";
import {
  TRUST_ASSURANCE_SECURITY_TRUST_ASSURANCE_LINK,
  TRUST_ASSURANCE_SECURITY_TRUST_CENTER_LINK,
  TRUST_ASSURANCE_SECURITY_TRUST_COMPACT_LINE,
  TRUST_ASSURANCE_SECURITY_TRUST_HEADING,
  TRUST_ASSURANCE_SECURITY_TRUST_HUB_LINK,
  TRUST_ASSURANCE_SECURITY_TRUST_WHY_THREE,
} from "@/lib/vocabulary/trust-assurance-security-trust-vocabulary";

describe("TrustAssuranceSecurityTrustVocabularyRail (TB-2302)", () => {
  it("renders trust-center strip with peers to assurance and hub", () => {
    render(<TrustAssuranceSecurityTrustVocabularyRail currentSurfaceId="trust-center" />);

    const strip = screen.getByTestId("trust-assurance-security-trust-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "trust-center");
    expect(strip.textContent ?? "").toContain(TRUST_ASSURANCE_SECURITY_TRUST_COMPACT_LINE);

    const assurancePeer = screen.getByTestId(
      "trust-assurance-security-trust-vocabulary-peer-assurance-status",
    );
    expect(assurancePeer).toHaveTextContent(TRUST_ASSURANCE_SECURITY_TRUST_ASSURANCE_LINK.label);
    expect(assurancePeer).toHaveAttribute("href", TRUST_ASSURANCE_SECURITY_TRUST_ASSURANCE_LINK.href);

    const hubPeer = screen.getByTestId(
      "trust-assurance-security-trust-vocabulary-peer-security-trust-hub",
    );
    expect(hubPeer).toHaveTextContent(TRUST_ASSURANCE_SECURITY_TRUST_HUB_LINK.label);
    expect(hubPeer).toHaveAttribute("href", TRUST_ASSURANCE_SECURITY_TRUST_HUB_LINK.href);
  });

  it("renders security-trust-hub strip with peers to Trust Center and Assurance", () => {
    render(
      <TrustAssuranceSecurityTrustVocabularyRail currentSurfaceId="security-trust-hub" />,
    );

    const trustPeer = screen.getByTestId(
      "trust-assurance-security-trust-vocabulary-peer-trust-center",
    );
    expect(trustPeer).toHaveTextContent(TRUST_ASSURANCE_SECURITY_TRUST_CENTER_LINK.label);
    expect(trustPeer).toHaveAttribute("href", TRUST_ASSURANCE_SECURITY_TRUST_CENTER_LINK.href);
  });

  it("renders full variant with why-three explanation", () => {
    render(
      <TrustAssuranceSecurityTrustVocabularyRail
        currentSurfaceId="assurance-status"
        variant="full"
      />,
    );

    expect(screen.getByText(TRUST_ASSURANCE_SECURITY_TRUST_HEADING)).toBeInTheDocument();
    expect(screen.getByText(TRUST_ASSURANCE_SECURITY_TRUST_WHY_THREE)).toBeInTheDocument();
  });
});
