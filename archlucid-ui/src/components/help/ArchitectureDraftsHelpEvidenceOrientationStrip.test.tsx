import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureDraftsHelpEvidenceOrientationStrip } from "@/components/help/ArchitectureDraftsHelpEvidenceOrientationStrip";
import {
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_DRAFTS_HELP_SOURCES,
} from "@/lib/architecture-drafts-help-evidence-copy";

describe("ArchitectureDraftsHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and Sources follow-up links with unique React keys", () => {
    const sourceKeys = ARCHITECTURE_DRAFTS_HELP_SOURCES.map((source) => `${source.href}-${source.label}`);

    expect(new Set(sourceKeys).size).toBe(sourceKeys.length);

    render(<ArchitectureDraftsHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("help-architecture-drafts-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-drafts-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE,
    );

    for (const source of ARCHITECTURE_DRAFTS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });
});
