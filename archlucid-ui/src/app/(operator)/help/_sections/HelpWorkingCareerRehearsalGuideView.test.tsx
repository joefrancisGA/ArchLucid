import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpWorkingCareerRehearsalGuideView } from "@/app/(operator)/help/_sections/HelpWorkingCareerRehearsalGuideView";
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import {
  WORKING_CAREER_REHEARSAL_HELP_PRIMARY_ACTION,
  WORKING_CAREER_REHEARSAL_HELP_PAGE_TITLE,
} from "@/lib/governance/working-career-rehearsal-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpWorkingCareerRehearsalGuideView (AS-082)", () => {
  const entry = getProductDocumentationEntry("career-rehearsal-doors");

  it("renders Record and Practice review type tiles and simulator honesty copy", () => {
    if (entry === undefined) {
      throw new Error("Expected career-rehearsal-doors documentation entry.");
    }

    render(<HelpWorkingCareerRehearsalGuideView entry={entry} />);

    expect(screen.getByTestId("help-career-rehearsal-doors-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-career-rehearsal-doors-page-title")).toHaveTextContent(
      WORKING_CAREER_REHEARSAL_HELP_PAGE_TITLE,
    );
    expect(screen.getByTestId(`help-career-rehearsal-door-tile-career`)).toHaveTextContent(
      WORKING_CAREER_DOOR_LABEL,
    );
    expect(screen.getByTestId(`help-career-rehearsal-door-tile-rehearsal`)).toHaveTextContent(
      WORKING_REHEARSAL_DOOR_LABEL,
    );
    expect(screen.getByTestId("help-career-rehearsal-doors-simulator-honesty")).toHaveTextContent(/sponsor exports/i);
    expect(screen.getByTestId("help-career-rehearsal-doors-security-note")).toHaveTextContent(/SecureNow/i);
    expect(screen.getByRole("link", { name: WORKING_CAREER_REHEARSAL_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      WORKING_CAREER_REHEARSAL_HELP_PRIMARY_ACTION.href,
    );
  });
});
