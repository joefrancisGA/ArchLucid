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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/decision-register",
}));

import { HelpDecisionRegisterGuideView } from "@/app/(operator)/help/_sections/HelpDecisionRegisterGuideView";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  DECISION_REGISTER_HELP_PRIMARY_ACTION,
  DECISION_REGISTER_HELP_START_HERE_CARD_TITLE,
} from "@/lib/decision-register-help-guide-content";
import {
  DECISION_REGISTER_HELP_CLAIM_DISCIPLINE,
  DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE,
  DECISION_REGISTER_HELP_SOURCES,
} from "@/lib/decision-register-help-evidence-copy";
import {
  DECISION_REGISTER_HELP_FIRST_VIEWPORT_TEST_ID,
  DECISION_REGISTER_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  DECISION_REGISTER_HELP_SKIP_LINK_LABEL,
  DECISION_REGISTER_HELP_SKIP_TARGET_ID,
} from "@/lib/decision-register-help-page-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpDecisionRegisterGuideView buyer-polished shell (HDE)", () => {
  const entry = getProductDocumentationEntry("decision-register");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides operator chrome", () => {
    if (entry === undefined) {
      throw new Error("Expected decision-register documentation entry.");
    }

    render(<HelpDecisionRegisterGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: DECISION_REGISTER_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${DECISION_REGISTER_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(DECISION_REGISTER_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      DECISION_REGISTER_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-decision-register-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-decision-register-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-decision-register-header-actions")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-decision-register-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-decision-register-primary-content");
    const firstViewport = screen.getByTestId(DECISION_REGISTER_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-decision-register-action-panel");
    const orientationBottom = screen.getByTestId("help-decision-register-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-decision-register-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      within(actionPanel).getByRole("link", { name: DECISION_REGISTER_HELP_PRIMARY_ACTION.label }),
    ).toHaveAttribute("href", DECISION_REGISTER_HELP_PRIMARY_ACTION.href);
    expect(
      screen.getByRole("heading", { level: 2, name: DECISION_REGISTER_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();

    for (const source of DECISION_REGISTER_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
