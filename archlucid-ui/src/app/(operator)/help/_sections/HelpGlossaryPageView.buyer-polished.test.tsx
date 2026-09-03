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

import { HelpGlossaryPageView } from "@/app/(operator)/help/_sections/HelpGlossaryPageView";
import {
  GLOSSARY_HELP_FOLLOW_UP_LINKS,
  GLOSSARY_HELP_FOLLOW_UPS_TITLE,
  GLOSSARY_HELP_HEADER_CLAIM_DISCIPLINE,
} from "@/lib/glossary-help-evidence-copy";
import {
  GLOSSARY_HELP_FIRST_VIEWPORT_TEST_ID,
  GLOSSARY_HELP_PRIMARY_CONTENT_ID,
  GLOSSARY_HELP_SKIP_LINK_LABEL,
  GLOSSARY_HELP_SKIP_TARGET_ID,
} from "@/lib/glossary-help-page-copy";
import { GLOSSARY_HELP_PRIMARY_ACTIONS } from "@/lib/glossary-help-guide-content";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpGlossaryPageView buyer-polished shell (HGE)", () => {
  const entry = getProductDocumentationEntry("glossary");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (entry === undefined) {
      throw new Error("Expected glossary documentation entry.");
    }

    render(<HelpGlossaryPageView entry={entry} />);

    expect(screen.getByRole("link", { name: GLOSSARY_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GLOSSARY_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-glossary-header-claim-discipline")).toHaveTextContent(
      GLOSSARY_HELP_HEADER_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("glossary-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-export-actions")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: GLOSSARY_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-glossary-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(GLOSSARY_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(GLOSSARY_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-glossary-action-panel");
    const orientationBottom = screen.getByTestId("help-glossary-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-glossary-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      within(actionPanel).getByRole("link", { name: GLOSSARY_HELP_PRIMARY_ACTIONS.openReviews.label }),
    ).toHaveAttribute("href", GLOSSARY_HELP_PRIMARY_ACTIONS.openReviews.href);

    for (const source of GLOSSARY_HELP_FOLLOW_UP_LINKS) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
