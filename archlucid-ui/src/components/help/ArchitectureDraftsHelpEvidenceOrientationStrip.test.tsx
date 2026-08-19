import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureDraftsHelpEvidenceOrientationStrip } from "@/components/help/ArchitectureDraftsHelpEvidenceOrientationStrip";
import {
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_DRAFTS_HELP_SOURCES,
} from "@/lib/architecture-drafts-help-evidence-copy";

describe("ArchitectureDraftsHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline heading, buyer-safe copy, and unique Sources hrefs", () => {
    const sourceHrefs = ARCHITECTURE_DRAFTS_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);

    render(<ArchitectureDraftsHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("help-architecture-drafts-orientation")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-drafts-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("help-architecture-drafts-claim-discipline").textContent?.toLowerCase()).not.toContain(
      "bootstrap",
    );

    for (const source of ARCHITECTURE_DRAFTS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });
});
