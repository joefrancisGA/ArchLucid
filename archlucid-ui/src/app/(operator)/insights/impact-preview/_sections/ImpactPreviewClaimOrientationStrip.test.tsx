import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImpactPreviewClaimOrientationStrip } from "@/app/(operator)/insights/impact-preview/_sections/ImpactPreviewClaimOrientationStrip";
import {
  IMPACT_PREVIEW_CLAIM_DISCIPLINE,
  IMPACT_PREVIEW_CLAIM_DISCIPLINE_HEADING,
  IMPACT_PREVIEW_SOURCES_INTRO,
} from "@/lib/impact-preview-evidence-copy";

describe("ImpactPreviewClaimOrientationStrip", () => {
  it("mounts claim discipline and sources for impact preview", () => {
    render(<ImpactPreviewClaimOrientationStrip />);

    expect(screen.getByTestId("impact-preview-orientation")).toBeInTheDocument();
    expect(screen.getByText(IMPACT_PREVIEW_CLAIM_DISCIPLINE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(IMPACT_PREVIEW_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.getByText(IMPACT_PREVIEW_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-sources")).toBeInTheDocument();
  });
});
