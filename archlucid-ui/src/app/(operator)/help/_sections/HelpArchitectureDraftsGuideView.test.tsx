import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpArchitectureDraftsGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureDraftsGuideView";
import {
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/architecture-drafts-help-evidence-copy";
import {
  ARCHITECTURE_DRAFTS_HELP_CLAIM_HEADING_ID,
  ARCHITECTURE_DRAFTS_HELP_GUIDE_HEADINGS,
} from "@/lib/architecture-drafts-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpArchitectureDraftsGuideView", () => {
  const entry = getProductDocumentationEntry("architecture-drafts");

  it("renders claim discipline heading id and guide headings in the TOC", () => {
    if (entry === undefined) {
      throw new Error("Expected architecture-drafts documentation entry.");
    }

    render(<HelpArchitectureDraftsGuideView entry={entry} />);

    expect(screen.getByTestId("help-architecture-drafts-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-drafts-claim-discipline").textContent).toContain(
      ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      ARCHITECTURE_DRAFTS_HELP_CLAIM_HEADING_ID,
    );

    for (const heading of ARCHITECTURE_DRAFTS_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
