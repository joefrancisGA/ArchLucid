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

import { HelpApiKeysGuideView } from "@/app/(operator)/help/_sections/HelpApiKeysGuideView";
import {
  API_KEYS_HELP_ACTION_PANEL_TITLE,
  API_KEYS_HELP_PRIMARY_ACTIONS,
} from "@/lib/api-keys-help-guide-content";
import {
  API_KEYS_HELP_CLAIM_DISCIPLINE,
  API_KEYS_HELP_FOLLOW_UPS_TITLE,
  API_KEYS_HELP_SOURCES,
} from "@/lib/api-keys-help-evidence-copy";
import {
  API_KEYS_HELP_FIRST_VIEWPORT_TEST_ID,
  API_KEYS_HELP_ORIENTATION_BOTTOM_TEST_ID,
  API_KEYS_HELP_PAGE_LEAD,
  API_KEYS_HELP_PAGE_SUBTITLE_BUYER,
  API_KEYS_HELP_SKIP_LINK_LABEL,
  API_KEYS_HELP_SKIP_TARGET_ID,
  API_KEYS_HELP_START_HERE_HELPER,
} from "@/lib/api-keys-help-page-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

describe("HelpApiKeysGuideView buyer-polished shell (HEP)", () => {
  const entry = getProductDocumentationEntry("api-keys");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (entry === undefined) {
      throw new Error("Expected api-keys documentation entry.");
    }

    render(<HelpApiKeysGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: API_KEYS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${API_KEYS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-api-keys-header-claim-discipline")).toHaveTextContent(
      API_KEYS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByText(API_KEYS_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("help-api-keys-intro")).toHaveTextContent(API_KEYS_HELP_PAGE_LEAD);
    expect(screen.getByTestId("help-api-keys-start-here-helper")).toHaveTextContent(
      API_KEYS_HELP_START_HERE_HELPER,
    );
    expect(screen.queryByTestId("help-api-keys-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-api-keys-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: API_KEYS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-api-keys-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-api-keys-primary-content");
    const firstViewport = screen.getByTestId(API_KEYS_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-api-keys-action-panel");
    const orientationBottom = screen.getByTestId(API_KEYS_HELP_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("help-api-keys-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      within(actionPanel).getByRole("link", { name: API_KEYS_HELP_PRIMARY_ACTIONS.usersAndRoles.label }),
    ).toHaveAttribute("href", API_KEYS_HELP_PRIMARY_ACTIONS.usersAndRoles.href);

    expectWhereToGoNextFollowUpLinks(within(sourcesSection), API_KEYS_HELP_SOURCES, "/");

    expect(screen.getByRole("heading", { level: 2, name: API_KEYS_HELP_ACTION_PANEL_TITLE })).toBeInTheDocument();
    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
