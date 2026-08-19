import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecurityTrustEvidenceOrientationStrip } from "@/components/marketing/SecurityTrustEvidenceOrientationStrip";
import {
  SECURITY_TRUST_CANONICAL_PATH,
  SECURITY_TRUST_SOURCES,
  SECURITY_TRUST_SOURCES_INTRO,
} from "@/lib/security-trust-evidence-copy";

describe("SecurityTrustEvidenceOrientationStrip", () => {
  it("renders Sources footer without the engagement-metadata claim callout", () => {
    render(<SecurityTrustEvidenceOrientationStrip />);

    expect(screen.getByTestId("assurance-status-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("assurance-status-claim-discipline")).toBeNull();
    expect(screen.getByText(SECURITY_TRUST_SOURCES_INTRO)).toBeInTheDocument();

    for (const link of SECURITY_TRUST_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SECURITY_TRUST_SOURCES.some((link) => link.href === SECURITY_TRUST_CANONICAL_PATH)).toBe(false);
  });
});
