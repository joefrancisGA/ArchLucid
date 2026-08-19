import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecurityTrustHelpHubVocabularyRail } from "@/components/SecurityTrustHelpHubVocabularyRail";
import {
  SECURITY_TRUST_HELP_HUB_COMPACT_LINE,
  SECURITY_TRUST_HELP_HUB_HEADING,
  SECURITY_TRUST_HELP_HUB_HELP_LINK,
  SECURITY_TRUST_HELP_HUB_HUB_LINK,
  SECURITY_TRUST_HELP_HUB_WHY_TWO,
} from "@/lib/vocabulary/security-trust-help-hub-vocabulary";

describe("SecurityTrustHelpHubVocabularyRail (TB-2315)", () => {
  it("renders security-trust-help strip with peer link to admin hub", () => {
    render(<SecurityTrustHelpHubVocabularyRail currentSurfaceId="security-trust-help" />);

    const strip = screen.getByTestId("security-trust-help-hub-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "security-trust-help");
    expect(strip.textContent ?? "").toContain(SECURITY_TRUST_HELP_HUB_COMPACT_LINE);

    const peer = screen.getByTestId("security-trust-help-hub-vocabulary-peer-link");
    expect(peer).toHaveTextContent(SECURITY_TRUST_HELP_HUB_HUB_LINK.label);
    expect(peer).toHaveAttribute("href", SECURITY_TRUST_HELP_HUB_HUB_LINK.href);
  });

  it("renders security-trust-hub strip with peer link to help topic", () => {
    render(<SecurityTrustHelpHubVocabularyRail currentSurfaceId="security-trust-hub" />);

    const peer = screen.getByTestId("security-trust-help-hub-vocabulary-peer-link");
    expect(peer).toHaveTextContent(SECURITY_TRUST_HELP_HUB_HELP_LINK.label);
    expect(peer).toHaveAttribute("href", SECURITY_TRUST_HELP_HUB_HELP_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <SecurityTrustHelpHubVocabularyRail
        currentSurfaceId="security-trust-help"
        variant="full"
      />,
    );

    expect(screen.getByText(SECURITY_TRUST_HELP_HUB_HEADING)).toBeInTheDocument();
    expect(screen.getByText(SECURITY_TRUST_HELP_HUB_WHY_TWO)).toBeInTheDocument();
  });
});
