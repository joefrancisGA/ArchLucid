import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompareEvidenceOrientationStrip } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareEvidenceOrientationStrip";
import { COMPARE_CANONICAL_PATH, COMPARE_SOURCES } from "@/lib/compare-evidence-copy";

describe("CompareEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking compare", () => {
    render(<CompareEvidenceOrientationStrip />);

    expect(screen.getByTestId("compare-sources")).toBeInTheDocument();
    expect(screen.getByTestId("compare-claim-discipline")).toHaveTextContent(/Directional diffs|diligence Sources/i);

    const sources = screen.getByTestId("compare-sources");

    for (const link of COMPARE_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(COMPARE_SOURCES.some((link) => link.href === COMPARE_CANONICAL_PATH)).toBe(false);
  });
});
