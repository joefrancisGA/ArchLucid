import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrustCenterEvidenceOrientationStrip } from "@/components/marketing/TrustCenterEvidenceOrientationStrip";
import {
  TRUST_CENTER_CANONICAL_PATH,
  TRUST_CENTER_CLAIM_DISCIPLINE_HEADING,
  TRUST_CENTER_SOURCES,
  TRUST_CENTER_SOURCES_INTRO,
} from "@/lib/trust-center-evidence-copy";

describe("TrustCenterEvidenceOrientationStrip", () => {
  it("renders claim discipline and Sources footer for procurement readers", () => {
    render(<TrustCenterEvidenceOrientationStrip />);

    expect(screen.getByTestId("trust-center-sources")).toBeInTheDocument();
    expect(screen.getByTestId("trust-center-claim-discipline")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: TRUST_CENTER_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByText(TRUST_CENTER_SOURCES_INTRO)).toBeInTheDocument();

    for (const link of TRUST_CENTER_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(TRUST_CENTER_SOURCES.some((link) => link.href === TRUST_CENTER_CANONICAL_PATH)).toBe(false);
  });
});
