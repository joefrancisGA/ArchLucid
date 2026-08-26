import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  HELP_HUB_CLAIM_DISCIPLINE_HEADING,
  HELP_HUB_FOLLOW_UPS_TITLE,
} from "@/lib/help/help-hub-evidence-copy";
import {
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

import { HelpPageView } from "@/app/(operator)/help/HelpPageView";

describe("HelpPageView buyer-polished shell (HEL)", () => {
  it("uses skip link, breadcrumb, claim orientation, and hides operator vocabulary rails", () => {
    render(<HelpPageView />);

    expect(screen.getByRole("link", { name: HELP_HUB_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${HELP_HUB_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("help-hub-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("help-hub-orientation-top")).toBeInTheDocument();
    // claim discipline folded into page header
    expect(screen.getByRole("heading", { level: 2, name: HELP_HUB_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-hub-primary-content")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Using ArchLucid" })).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
    expect(screen.queryByTestId("help-tour-trigger")).toBeNull();
    expect(screen.queryByTestId("glossary-procedural-help-vocabulary")).toBeNull();
    expect(screen.queryByTestId("report-problem-dialog-help-hub-vocabulary")).toBeNull();
  });
});
