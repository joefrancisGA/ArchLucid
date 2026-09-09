import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  HELP_HUB_CLAIM_DISCIPLINE,
  HELP_HUB_FOLLOW_UPS_TITLE,
} from "@/lib/help/help-hub-evidence-copy";
import {
  HELP_HUB_BUYER_START_HERE_HELPER,
  HELP_HUB_FIRST_VIEWPORT_TEST_ID,
  HELP_HUB_ORIENTATION_BOTTOM_TEST_ID,
  HELP_HUB_PAGE_SUBTITLE_BUYER,
  HELP_HUB_PRIMARY_CONTENT_ID,
  HELP_HUB_SKIP_LINK_LABEL,
} from "@/lib/help/help-hub-page-copy";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/operator/OperatorNavAuthorityProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/operator/OperatorNavAuthorityProvider")>();

  return {
    ...actual,
    useOperatorNavAuthority: () => ({
      callerAuthorityRank: 1,
      isAuthorityLoading: false,
      currentPrincipal: { authorityRank: 1 },
    }),
    useNavCallerAuthorityRank: () => 1,
  };
});

vi.mock("@/app/(operator)/help/HelpTourTrigger", () => ({
  HelpTourTrigger: () => <div data-testid="help-tour-trigger" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "architecture" }),
}));

import { HelpPageView } from "@/app/(operator)/help/HelpPageView";

describe("HelpPageView buyer-polished shell (HEL)", () => {
  it("uses skip link, buyer subtitle, first-viewport intro, bottom orientation, and hides operator vocabulary rails", () => {
    render(<HelpPageView />);

    expect(screen.getByRole("link", { name: HELP_HUB_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${HELP_HUB_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("help-hub-claim-discipline").textContent).toContain(
      HELP_HUB_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByText(HELP_HUB_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId(HELP_HUB_FIRST_VIEWPORT_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("help-hub-intro")).toHaveTextContent(/Start with the guides below/);
    expect(screen.getByTestId("help-hub-buyer-start-here-helper")).toHaveTextContent(
      HELP_HUB_BUYER_START_HERE_HELPER,
    );
    expect(screen.getByRole("heading", { level: 2, name: HELP_HUB_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-hub-primary-content")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Using ArchLucid" })).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
    expect(screen.queryByTestId("help-tour-trigger")).toBeNull();
    expect(screen.queryByTestId("glossary-procedural-help-vocabulary")).toBeNull();
    expect(screen.queryByTestId("report-problem-dialog-help-hub-vocabulary")).toBeNull();
    expect(screen.queryByTestId("help-hub-orientation-top")).toBeNull();

    const primary = screen.getByTestId("help-hub-primary-content");
    const orientation = screen.getByTestId(HELP_HUB_ORIENTATION_BOTTOM_TEST_ID);
    const guideHeading = screen.getByRole("heading", { name: "Using ArchLucid" });

    expect(primary).toContainElement(orientation);
    expect(guideHeading.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
