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

vi.mock("@/app/(operator)/integrations/cloud-connections/_sections/GcpWifStarterPanel", () => ({
  GcpWifStarterPanel: () => <div data-testid="gcp-wif-starter-panel" />,
}));

import { HelpConnectGcpSecurelyGuideView } from "@/app/(operator)/help/_sections/HelpConnectGcpSecurelyGuideView";
import {
  CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE,
} from "@/lib/connect-gcp-securely-help-evidence-copy";
import {
  CONNECT_GCP_SECURELY_HELP_PRIMARY_CONTENT_ID,
  CONNECT_GCP_SECURELY_HELP_SKIP_LINK_LABEL,
} from "@/lib/connect-gcp-securely-help-page-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpConnectGcpSecurelyGuideView buyer-polished shell", () => {
  const entry = getProductDocumentationEntry("cloud-connections-gcp");

  it("renders skip link, breadcrumb, and claim orientation above body", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-gcp documentation entry.");
    }

    render(<HelpConnectGcpSecurelyGuideView entry={entry} />);

    const skipLink = screen.getByRole("link", { name: CONNECT_GCP_SECURELY_HELP_SKIP_LINK_LABEL });
    expect(skipLink).toHaveAttribute("href", `#${CONNECT_GCP_SECURELY_HELP_PRIMARY_CONTENT_ID}`);

    expect(screen.getByTestId("connect-gcp-securely-help-claim-discipline").textContent).toContain(
      CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("connect-gcp-securely-help-sources")).toBeInTheDocument();

    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
    expect(screen.queryByTestId("help-topic-print-button")).toBeNull();
    expect(screen.getByTestId("connect-gcp-configure-action")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-connect-gcp-securely-primary-content");
    const body = screen.getByTestId("help-connect-gcp-securely-primary");
    const orientation = screen.getByTestId("connect-gcp-securely-help-orientation");

    expect(primaryContent).toContainElement(orientation);
    expect(orientation.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
