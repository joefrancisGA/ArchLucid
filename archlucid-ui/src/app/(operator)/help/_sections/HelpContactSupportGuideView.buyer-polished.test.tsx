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
  CONTACT_SUPPORT_HELP_CLAIM_DISCIPLINE,
} from "@/lib/contact-support-help-evidence-copy";
import {
  CONTACT_SUPPORT_PRIMARY_ACTIONS,
} from "@/lib/contact-support-help-guide-content";
import {
  CONTACT_SUPPORT_HELP_SKIP_LINK_LABEL,
  CONTACT_SUPPORT_HELP_SKIP_TARGET_ID,
} from "@/lib/contact-support-help-page-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpContactSupportGuideView buyer-polished shell", () => {
  const entry = getProductDocumentationEntry("contact-support");

  it("renders skip link to support actions and orientation after body", () => {
    if (entry === undefined) {
      throw new Error("Expected contact-support documentation entry.");
    }

    render(<HelpContactSupportGuideView entry={entry} />);

    const skipLink = screen.getByRole("link", { name: CONTACT_SUPPORT_HELP_SKIP_LINK_LABEL });
    expect(skipLink).toHaveAttribute("href", `#${CONTACT_SUPPORT_HELP_SKIP_TARGET_ID}`);

    expect(screen.getByTestId("contact-support-help-claim-discipline").textContent).toContain(
      CONTACT_SUPPORT_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("contact-support-help-sources")).toBeInTheDocument();

    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
    expect(screen.queryByTestId("help-topic-print-button")).toBeNull();
    expect(screen.queryByTestId("help-contact-support-email-action")).toBeNull();
    expect(screen.getByTestId(CONTACT_SUPPORT_PRIMARY_ACTIONS.emailSupport.testId)).toHaveAttribute(
      "href",
      CONTACT_SUPPORT_PRIMARY_ACTIONS.emailSupport.href,
    );

    const actionsSection = screen.getByTestId("help-contact-support-actions-section");
    const primaryContent = screen.getByTestId("help-contact-support-primary-content");
    const body = screen.getByTestId("help-contact-support-primary");
    const orientation = screen.getByTestId("contact-support-help-orientation");

    expect(primaryContent).toContainElement(actionsSection);
    expect(actionsSection.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(body.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
