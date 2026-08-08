import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrivacyEvidenceOrientationStrip } from "@/components/marketing/PrivacyEvidenceOrientationStrip";
import { PRIVACY_CANONICAL_PATH, PRIVACY_SOURCES } from "@/lib/privacy-evidence-copy";

describe("PrivacyEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking privacy", () => {
    render(<PrivacyEvidenceOrientationStrip />);

    expect(screen.getByTestId("privacy-sources")).toBeInTheDocument();
    expect(screen.getByTestId("privacy-claim-discipline")).toBeInTheDocument();

    for (const link of PRIVACY_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(PRIVACY_SOURCES.some((link) => link.href === PRIVACY_CANONICAL_PATH)).toBe(false);
  });
});
