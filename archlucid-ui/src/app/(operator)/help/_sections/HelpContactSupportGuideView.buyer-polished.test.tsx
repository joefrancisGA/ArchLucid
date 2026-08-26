import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useNavCallerAuthorityRank = vi.hoisted(() => vi.fn(() => 3));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => useNavCallerAuthorityRank(),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/lib/use-support-bundle-download", () => ({
  useSupportBundleDownload: () => ({
    downloading: false,
    bundleStatus: "idle",
    error: null,
    lastGeneratedAt: null,
    onDownload: vi.fn(),
  }),
}));

vi.mock("@/lib/operator/operator-scope-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator/operator-scope-storage")>();

  return {
    ...actual,
    readOperatorScopeFromStorage: () => ({
      workspaceId: "ws-1",
      workspaceLabel: "Pilot workspace",
    }),
  };
});

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { HelpContactSupportGuideView } from "@/app/(operator)/help/_sections/HelpContactSupportGuideView";
import {
  CONTACT_SUPPORT_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/contact-support-help-evidence-copy";
import {
  CONTACT_SUPPORT_PRIMARY_ACTIONS,
} from "@/lib/contact-support-help-guide-content";
import {
  CONTACT_SUPPORT_HELP_PRIMARY_CONTENT_ID,
  CONTACT_SUPPORT_HELP_SKIP_LINK_LABEL,
} from "@/lib/contact-support-help-page-copy";
import { HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpContactSupportGuideView buyer-polished shell", () => {
  const entry = getProductDocumentationEntry("contact-support");

  it("renders skip link, breadcrumb, and claim orientation above body", () => {
    if (entry === undefined) {
      throw new Error("Expected contact-support documentation entry.");
    }

    render(<HelpContactSupportGuideView entry={entry} />);

    const skipLink = screen.getByRole("link", { name: CONTACT_SUPPORT_HELP_SKIP_LINK_LABEL });
    expect(skipLink).toHaveAttribute("href", `#${CONTACT_SUPPORT_HELP_PRIMARY_CONTENT_ID}`);

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb).toHaveTextContent(HELP_TOPIC_BREADCRUMB_HUB_LABEL);
    expect(breadcrumb).toHaveTextContent(entry.title);

    // claim discipline folded into page header
    expect(screen.getByTestId("contact-support-help-sources")).toBeInTheDocument();

    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
    expect(screen.queryByTestId("help-topic-print-button")).toBeNull();
    expect(screen.getByTestId("help-contact-support-email-action")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-contact-support-primary-content");
    const body = screen.getByTestId("help-contact-support-primary");
    const orientation = screen.getByTestId("contact-support-help-orientation");

    expect(primaryContent).toContainElement(orientation);
    expect(orientation.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.getByTestId("help-contact-support-email-action")).toHaveAttribute(
      "href",
      CONTACT_SUPPORT_PRIMARY_ACTIONS.emailSupport.href,
    );
  });
});
