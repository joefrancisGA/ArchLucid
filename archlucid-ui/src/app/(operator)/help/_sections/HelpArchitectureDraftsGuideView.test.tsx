import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpArchitectureDraftsGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureDraftsGuideView";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  expectClaimDisciplineBandContent,
  expectClaimDisciplineHeading,
} from "@/lib/claim-discipline-test-helpers";
import {
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/architecture-drafts-help-evidence-copy";
import {
  ARCHITECTURE_DRAFTS_HELP_CLAIM_HEADING_ID,
  ARCHITECTURE_DRAFTS_HELP_GUIDE_HEADINGS,
  ARCHITECTURE_DRAFTS_HELP_HOW_TO_SECTION_TITLE,
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
    expect(screen.getByTestId("help-architecture-drafts-claim-discipline-strip")).toHaveTextContent(
      ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE,
    );
    expectClaimDisciplineBandContent(
      screen,
      "help-architecture-drafts",
      "help-architecture-drafts-claim-discipline",
      ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expectClaimDisciplineHeading(
      screen,
      "help-architecture-drafts",
      ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING,
      ARCHITECTURE_DRAFTS_HELP_CLAIM_HEADING_ID,
    );

    expect(screen.getByRole("heading", { level: 2, name: ARCHITECTURE_DRAFTS_HELP_HOW_TO_SECTION_TITLE })).toBeInTheDocument();

    for (const heading of resolveGuideHeadingsForStrip(
      "help-architecture-drafts",
      ARCHITECTURE_DRAFTS_HELP_GUIDE_HEADINGS,
      ARCHITECTURE_DRAFTS_HELP_CLAIM_HEADING_ID,
    )) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
