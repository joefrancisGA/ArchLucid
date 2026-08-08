import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImpactPreviewEvidenceOrientationStrip } from "@/app/(operator)/insights/impact-preview/_sections/ImpactPreviewEvidenceOrientationStrip";
import {
  IMPACT_PREVIEW_CANONICAL_PATH,
  IMPACT_PREVIEW_SOURCES,
} from "@/lib/impact-preview-evidence-copy";

describe("ImpactPreviewEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking impact-preview", () => {
    render(<ImpactPreviewEvidenceOrientationStrip />);

    expect(screen.getByTestId("impact-preview-sources")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-claim-discipline")).toHaveTextContent(
      /Review-time|diligence Sources|CPA SOC 2/i,
    );

    const sources = screen.getByTestId("impact-preview-sources");

    for (const link of IMPACT_PREVIEW_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(IMPACT_PREVIEW_SOURCES.some((link) => link.href === IMPACT_PREVIEW_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
