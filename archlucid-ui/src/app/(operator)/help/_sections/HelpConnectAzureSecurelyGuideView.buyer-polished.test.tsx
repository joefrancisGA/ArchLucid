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

vi.mock("@/lib/resolve-nav-link-for-pathname", () => ({
  resolveNavIconForHref: () => null,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { HelpConnectAzureSecurelyGuideView } from "@/app/(operator)/help/_sections/HelpConnectAzureSecurelyGuideView";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";
import {
  CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AZURE_SECURELY_CONFIGURE_ACTION,
  CONNECT_AZURE_SECURELY_CONFIGURE_HREF,
  CONNECT_AZURE_SECURELY_CONNECTION_STATUS_HREF,
  CONNECT_AZURE_SECURELY_FOLLOW_UPS_TITLE,
  CONNECT_AZURE_SECURELY_SOURCES,
} from "@/lib/connect-azure-securely-help-content";
import {
  CONNECT_AZURE_SECURELY_HELP_FIRST_VIEWPORT_TEST_ID,
  CONNECT_AZURE_SECURELY_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  CONNECT_AZURE_SECURELY_HELP_SKIP_LINK_LABEL,
  CONNECT_AZURE_SECURELY_HELP_SKIP_TARGET_ID,
} from "@/lib/connect-azure-securely-help-page-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpConnectAzureSecurelyGuideView buyer-polished shell (HC)", () => {
  const entry = getProductDocumentationEntry("cloud-connections-azure");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides operator chrome", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-azure documentation entry.");
    }

    render(<HelpConnectAzureSecurelyGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: CONNECT_AZURE_SECURELY_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${CONNECT_AZURE_SECURELY_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(CONNECT_AZURE_SECURELY_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-connect-azure-securely-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("connect-azure-securely-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: CONNECT_AZURE_SECURELY_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-connect-azure-securely-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-connect-azure-securely-primary-content");
    const firstViewport = screen.getByTestId(CONNECT_AZURE_SECURELY_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-connect-azure-securely-action-panel");
    const orientationBottom = screen.getByTestId("help-connect-azure-securely-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-connect-azure-securely-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(within(actionPanel).getByRole("link", { name: CONNECT_AZURE_SECURELY_CONFIGURE_ACTION })).toHaveAttribute(
      "href",
      CONNECT_AZURE_SECURELY_CONFIGURE_HREF,
    );
    expect(within(actionPanel).getByRole("link", { name: "Verify the connection" })).toBeInTheDocument();
    expect(within(actionPanel).getByRole("link", { name: /Connection status/i })).toHaveAttribute(
      "href",
      CONNECT_AZURE_SECURELY_CONNECTION_STATUS_HREF,
    );

    for (const source of CONNECT_AZURE_SECURELY_SOURCES) {
      expectFollowUpLink(within(sourcesSection), source);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
