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

import { HelpServiceNowIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpServiceNowIntegrationGuideView";
import {
  SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  SERVICENOW_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  SERVICENOW_INTEGRATION_HELP_SOURCES,
} from "@/lib/servicenow-integration-help-evidence-copy";
import {
  SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION,
} from "@/lib/servicenow-integration-help-guide-content";
import {
  SERVICENOW_INTEGRATION_HELP_FIRST_VIEWPORT_TEST_ID,
  SERVICENOW_INTEGRATION_HELP_PRIMARY_CONTENT_ID,
  SERVICENOW_INTEGRATION_HELP_SKIP_LINK_LABEL,
  SERVICENOW_INTEGRATION_HELP_SKIP_TARGET_ID,
} from "@/lib/servicenow-integration-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpServiceNowIntegrationGuideView buyer-polished shell (ESX)", () => {
  const entry = getProductDocumentationEntry("servicenow-integration");

  it("renders skip link, first-viewport band, header claim discipline, and sources-only orientation", () => {
    if (entry === undefined) {
      throw new Error("Expected servicenow-integration documentation entry.");
    }

    render(<HelpServiceNowIntegrationGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: SERVICENOW_INTEGRATION_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SERVICENOW_INTEGRATION_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-servicenow-integration-header-claim-discipline")).toHaveTextContent(
      SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-servicenow-integration-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SERVICENOW_INTEGRATION_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-servicenow-integration-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(SERVICENOW_INTEGRATION_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(SERVICENOW_INTEGRATION_HELP_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("help-servicenow-integration-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-servicenow-integration-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId(SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveLength(2);

    for (const source of SERVICENOW_INTEGRATION_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
