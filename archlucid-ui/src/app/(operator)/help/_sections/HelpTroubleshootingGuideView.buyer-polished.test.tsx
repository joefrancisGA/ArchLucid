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

vi.mock("@/components/SupportBundleDownloadButton", () => ({
  SupportBundleDownloadButton: () => <button type="button">Download support bundle</button>,
}));

vi.mock("@/app/(operator)/help/_sections/HelpTroubleshootingAdvancedDiagnostics", () => ({
  HelpTroubleshootingAdvancedDiagnostics: () => <div data-testid="troubleshooting-advanced-diagnostics-mock" />,
}));

vi.mock("@/components/help/TroubleshootingStartHerePlatformStatus", () => ({
  TroubleshootingStartHerePlatformStatus: () => (
    <div data-testid="troubleshooting-platform-status">
      <span>Platform healthy</span>
    </div>
  ),
}));

import { HelpTroubleshootingGuideView } from "@/app/(operator)/help/_sections/HelpTroubleshootingGuideView";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
  TROUBLESHOOTING_HELP_FOLLOW_UPS_TITLE,
  TROUBLESHOOTING_HELP_SOURCES,
} from "@/lib/troubleshooting-help-evidence-copy";
import { TROUBLESHOOTING_HELP_PRIMARY_ACTION } from "@/lib/troubleshooting-help-guide-content";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";
import {
  TROUBLESHOOTING_HELP_FIRST_VIEWPORT_TEST_ID,
  TROUBLESHOOTING_HELP_PRIMARY_CONTENT_ID,
  TROUBLESHOOTING_HELP_SKIP_LINK_LABEL,
  TROUBLESHOOTING_HELP_SKIP_TARGET_ID,
} from "@/lib/troubleshooting-help-page-copy";

describe("HelpTroubleshootingGuideView buyer-polished shell (HTX)", () => {
  const entry = getProductDocumentationEntry("troubleshooting");

  it("renders skip link, first-viewport band, header claim discipline, and sources-only orientation", () => {
    if (entry === undefined) {
      throw new Error("Expected troubleshooting documentation entry.");
    }

    render(<HelpTroubleshootingGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: TROUBLESHOOTING_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${TROUBLESHOOTING_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-troubleshooting-header-claim-discipline")).toHaveTextContent(
      TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-troubleshooting-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: TROUBLESHOOTING_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-troubleshooting-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(TROUBLESHOOTING_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(TROUBLESHOOTING_HELP_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("help-troubleshooting-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-troubleshooting-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getAllByTestId(TROUBLESHOOTING_HELP_PRIMARY_ACTION.testId)[0]).toHaveAttribute(
      "href",
      TROUBLESHOOTING_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByTestId(TROUBLESHOOTING_HELP_PRIMARY_ACTION.testId).length).toBeGreaterThanOrEqual(1);

    expectWhereToGoNextFollowUpLinks(within(sourcesSection), TROUBLESHOOTING_HELP_SOURCES, "/");

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
