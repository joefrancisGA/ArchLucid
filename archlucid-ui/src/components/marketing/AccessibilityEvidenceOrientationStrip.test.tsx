import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccessibilityEvidenceOrientationStrip } from "@/components/marketing/AccessibilityEvidenceOrientationStrip";
import {
  ACCESSIBILITY_CANONICAL_PATH,
  ACCESSIBILITY_SOURCES,
} from "@/lib/accessibility-evidence-copy";
import { shouldOmitClaimDisciplineBand } from "@/lib/claim-discipline-policy";

describe("AccessibilityEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking accessibility", () => {
    render(<AccessibilityEvidenceOrientationStrip />);

    const sources = screen.getByTestId("accessibility-sources");
    expect(sources).toBeInTheDocument();

    if (!shouldOmitClaimDisciplineBand("accessibility")) {
      expect(screen.getByTestId("accessibility-claim-discipline")).toBeInTheDocument();
    } else {
      expect(screen.queryByTestId("accessibility-claim-discipline")).not.toBeInTheDocument();
    }

    for (const link of ACCESSIBILITY_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(ACCESSIBILITY_SOURCES.some((link) => link.href === ACCESSIBILITY_CANONICAL_PATH)).toBe(false);
  });
});
