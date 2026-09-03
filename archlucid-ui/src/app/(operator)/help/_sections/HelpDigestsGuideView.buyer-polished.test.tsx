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

import { HelpDigestsGuideView } from "@/app/(operator)/help/_sections/HelpDigestsGuideView";
import {
  DIGESTS_HELP_CLAIM_DISCIPLINE,
  DIGESTS_HELP_FOLLOW_UPS_TITLE,
  DIGESTS_HELP_SOURCES,
} from "@/lib/digests-help-evidence-copy";
import { DIGESTS_HELP_PRIMARY_ACTION } from "@/lib/digests-help-guide-content";
import {
  DIGESTS_HELP_FIRST_VIEWPORT_TEST_ID,
  DIGESTS_HELP_SKIP_LINK_LABEL,
  DIGESTS_HELP_SKIP_TARGET_ID,
} from "@/lib/digests-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpDigestsGuideView buyer-polished shell (HDG)", () => {
  const entry = getProductDocumentationEntry("digests");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (entry === undefined) {
      throw new Error("Expected digests documentation entry.");
    }

    render(<HelpDigestsGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: DIGESTS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${DIGESTS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-digests-header-claim-discipline")).toHaveTextContent(
      DIGESTS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-digests-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-digests-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: DIGESTS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-digests-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-digests-primary-content");
    const firstViewport = screen.getByTestId(DIGESTS_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-digests-action-panel");
    const orientationBottom = screen.getByTestId("help-digests-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-digests-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      within(actionPanel).getByRole("link", { name: DIGESTS_HELP_PRIMARY_ACTION.label }),
    ).toHaveAttribute("href", DIGESTS_HELP_PRIMARY_ACTION.href);

    for (const source of DIGESTS_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(screen.getByRole("heading", { level: 2, name: "Manage digests" })).toBeInTheDocument();
    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
