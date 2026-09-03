import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { HelpPilotGuideView } from "@/app/(operator)/help/_sections/HelpPilotGuideView";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import {
  PILOT_GUIDE_HELP_CLAIM_DISCIPLINE,
  PILOT_GUIDE_HELP_FOLLOW_UPS_TITLE,
  PILOT_GUIDE_HELP_SOURCES,
} from "@/lib/pilot-guide-help-evidence-copy";
import { PILOT_GUIDE_HELP_PRIMARY_ACTIONS } from "@/lib/pilot-guide-help-guide-content";
import {
  PILOT_GUIDE_HELP_FIRST_VIEWPORT_TEST_ID,
  PILOT_GUIDE_HELP_PRIMARY_CONTENT_ID,
  PILOT_GUIDE_HELP_SKIP_LINK_LABEL,
  PILOT_GUIDE_HELP_SKIP_TARGET_ID,
} from "@/lib/pilot-guide-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpPilotGuideView buyer-polished shell (HP)", () => {
  const loaded = tryLoadProductDocumentation("pilot-guide");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (loaded === null) {
      throw new Error("Expected pilot-guide documentation to load.");
    }

    render(<HelpPilotGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: PILOT_GUIDE_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${PILOT_GUIDE_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-pilot-guide-header-claim-discipline")).toHaveTextContent(
      PILOT_GUIDE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("pilot-guide-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-pilot-guide-related-links")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: PILOT_GUIDE_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-pilot-guide-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(PILOT_GUIDE_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(PILOT_GUIDE_HELP_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("help-pilot-guide-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-pilot-guide-sources");
    const headerActions = screen.getByTestId("help-pilot-guide-header-actions");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(within(headerActions).getByRole("link", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toHaveAttribute(
      "href",
      PILOT_GUIDE_HELP_PRIMARY_ACTIONS.startReview.href,
    );

    for (const source of PILOT_GUIDE_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
