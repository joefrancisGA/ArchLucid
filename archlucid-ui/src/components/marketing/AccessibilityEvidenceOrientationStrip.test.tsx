import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccessibilityEvidenceOrientationStrip } from "@/components/marketing/AccessibilityEvidenceOrientationStrip";
import {
  ACCESSIBILITY_CANONICAL_PATH,
  ACCESSIBILITY_SOURCES,
} from "@/lib/accessibility-evidence-copy";

describe("AccessibilityEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking accessibility", () => {
    render(<AccessibilityEvidenceOrientationStrip />);

    expect(screen.getByTestId("accessibility-sources")).toBeInTheDocument();
    expect(screen.getByTestId("accessibility-claim-discipline")).toBeInTheDocument();

    for (const link of ACCESSIBILITY_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(ACCESSIBILITY_SOURCES.some((link) => link.href === ACCESSIBILITY_CANONICAL_PATH)).toBe(false);
  });
});
