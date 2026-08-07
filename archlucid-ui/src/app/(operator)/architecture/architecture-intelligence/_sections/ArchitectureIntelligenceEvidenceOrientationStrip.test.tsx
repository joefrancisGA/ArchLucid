import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureIntelligenceEvidenceOrientationStrip } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceEvidenceOrientationStrip";
import {
  ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH,
  ARCHITECTURE_INTELLIGENCE_SOURCES,
} from "@/lib/architecture-intelligence-evidence-copy";

describe("ArchitectureIntelligenceEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Architecture intelligence", () => {
    render(<ArchitectureIntelligenceEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-intelligence-sources")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-claim-discipline")).toBeInTheDocument();

    for (const link of ARCHITECTURE_INTELLIGENCE_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      ARCHITECTURE_INTELLIGENCE_SOURCES.some(
        (link) => link.href === ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});
