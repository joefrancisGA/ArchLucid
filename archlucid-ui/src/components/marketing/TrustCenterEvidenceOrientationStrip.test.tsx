import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrustCenterEvidenceOrientationStrip } from "@/components/marketing/TrustCenterEvidenceOrientationStrip";
import {
  TRUST_CENTER_CANONICAL_PATH,
  TRUST_CENTER_SOURCES,
  TRUST_CENTER_SOURCES_INTRO,
} from "@/lib/trust-center-evidence-copy";

describe("TrustCenterEvidenceOrientationStrip", () => {
  it("renders Sources footer without the public-assurance claim callout", () => {
    render(<TrustCenterEvidenceOrientationStrip />);

    expect(screen.getByTestId("trust-center-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("trust-center-claim-discipline")).toBeNull();
    expect(screen.getByText(TRUST_CENTER_SOURCES_INTRO)).toBeInTheDocument();

    for (const link of TRUST_CENTER_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(TRUST_CENTER_SOURCES.some((link) => link.href === TRUST_CENTER_CANONICAL_PATH)).toBe(false);
  });
});
