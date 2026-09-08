/** @vitest-environment jsdom */
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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { HelpAiUsageGuideView } from "@/app/(operator)/help/_sections/HelpAiUsageGuideView";
import {
  AI_USAGE_HELP_CLAIM_DISCIPLINE,
  AI_USAGE_HELP_FOLLOW_UPS_TITLE,
  AI_USAGE_HELP_SOURCES,
} from "@/lib/ai-usage-help-evidence-copy";
import {
  AI_USAGE_HELP_PAGE_SUBTITLE,
  AI_USAGE_HELP_PRIMARY_ACTION,
} from "@/lib/ai-usage-help-guide-content";
import {
  AI_USAGE_HELP_FIRST_VIEWPORT_TEST_ID,
  AI_USAGE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AI_USAGE_HELP_ORIENTATION_BOTTOM_TEST_ID,
  AI_USAGE_HELP_PAGE_SUBTITLE_BUYER,
  AI_USAGE_HELP_PRIMARY_CONTENT_ID,
  AI_USAGE_HELP_SKIP_LINK_LABEL,
  AI_USAGE_HELP_SKIP_TARGET_ID,
  AI_USAGE_HELP_START_HERE_HELPER,
} from "@/lib/ai-usage-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpAiUsageGuideView buyer-polished shell (HAI)", () => {
  const entry = getProductDocumentationEntry("ai-usage");

  it("renders skip link, header claim discipline, first-viewport start here, and bottom Sources", () => {
    if (entry === undefined) {
      throw new Error("Expected ai-usage documentation entry.");
    }

    render(<HelpAiUsageGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: AI_USAGE_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AI_USAGE_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(AI_USAGE_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(AI_USAGE_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(AI_USAGE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      AI_USAGE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-ai-usage-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AI_USAGE_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(AI_USAGE_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(AI_USAGE_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-ai-usage-action-panel");
    const orientationBottom = screen.getByTestId(AI_USAGE_HELP_ORIENTATION_BOTTOM_TEST_ID);
    const overview = screen.getByTestId("help-ai-usage-overview");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(primaryContent).toContainElement(overview);
    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("help-ai-usage-start-here-helper")).toHaveTextContent(AI_USAGE_HELP_START_HERE_HELPER);
    expect(
      within(actionPanel).getByRole("link", { name: AI_USAGE_HELP_PRIMARY_ACTION.label }),
    ).toHaveAttribute("href", AI_USAGE_HELP_PRIMARY_ACTION.href);

    const sourcesSection = screen.getByTestId("help-ai-usage-sources");

    for (const source of filterWhereToGoNextFollowUpLinks(AI_USAGE_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
