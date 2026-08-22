import { render, screen } from "@testing-library/react";
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

import { HelpConnectAwsSecurelyGuideView } from "@/app/(operator)/help/_sections/HelpConnectAwsSecurelyGuideView";
import {
  CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/connect-aws-securely-help-evidence-copy";
import {
  CONNECT_AWS_SECURELY_HELP_PRIMARY_CONTENT_ID,
  CONNECT_AWS_SECURELY_HELP_SKIP_LINK_LABEL,
} from "@/lib/connect-aws-securely-help-page-copy";
import { CLOUD_CONNECTIONS_HELP_PAGE_TITLE } from "@/lib/cloud-connections-help-guide-content";
import { HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpConnectAwsSecurelyGuideView buyer-polished shell", () => {
  const entry = getProductDocumentationEntry("cloud-connections-aws");

  it("renders skip link, breadcrumb, and claim orientation above body", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-aws documentation entry.");
    }

    render(<HelpConnectAwsSecurelyGuideView entry={entry} />);

    const skipLink = screen.getByRole("link", { name: CONNECT_AWS_SECURELY_HELP_SKIP_LINK_LABEL });
    expect(skipLink).toHaveAttribute("href", `#${CONNECT_AWS_SECURELY_HELP_PRIMARY_CONTENT_ID}`);

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb).toHaveTextContent(HELP_TOPIC_BREADCRUMB_HUB_LABEL);
    expect(breadcrumb).toHaveTextContent(CLOUD_CONNECTIONS_HELP_PAGE_TITLE);
    expect(breadcrumb).toHaveTextContent(entry.title);

    expect(
      screen.getByRole("heading", { level: 2, name: CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("connect-aws-securely-help-sources")).toBeInTheDocument();

    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
    expect(screen.queryByTestId("help-topic-print-button")).toBeNull();
    expect(screen.getByTestId("connect-aws-configure-action")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-connect-aws-securely-primary-content");
    const body = screen.getByTestId("help-connect-aws-securely-primary");
    const orientation = screen.getByTestId("connect-aws-securely-help-orientation");

    expect(primaryContent).toContainElement(orientation);
    expect(orientation.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
