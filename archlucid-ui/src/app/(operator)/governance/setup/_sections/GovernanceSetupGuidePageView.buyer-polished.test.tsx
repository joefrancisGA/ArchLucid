import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { GovernanceSetupGuidePageView } from "./GovernanceSetupGuidePageView";
import {
  GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
  GOVERNANCE_SETUP_GUIDE_STEPS,
} from "./governance-setup-guide-steps";
import {
  GOVERNANCE_SETUP_OUTCOMES_HEADING,
} from "@/lib/governance/governance-setup-route";
import {
  GOVERNANCE_SETUP_BUYER_START_HERE_HELPER,
  GOVERNANCE_SETUP_PAGE_LEAD,
  GOVERNANCE_SETUP_PAGE_SUBTITLE_BUYER,
  GOVERNANCE_SETUP_PRIMARY_CONTENT_ID,
  GOVERNANCE_SETUP_SKIP_LINK_LABEL,
} from "@/lib/governance-setup-page-copy";
import {
  GOVERNANCE_SETUP_CLAIM_DISCIPLINE,
  GOVERNANCE_SETUP_FOLLOW_UPS_TITLE,
} from "@/lib/governance/governance-setup-evidence-copy";

describe("GovernanceSetupGuidePageView buyer-polished shell (GFX)", () => {
  it("renders skip link, first-viewport intro, claim discipline, and orientation after setup workspace", () => {
    render(
      <GovernanceSetupGuidePageView
        model={{
          steps: GOVERNANCE_SETUP_GUIDE_STEPS,
          foundationIndicators: GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
          stepStatuses: ["not-started", "not-started", "not-started", "not-started", "not-started"],
        }}
      />,
    );

    expect(screen.getByRole("link", { name: GOVERNANCE_SETUP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_SETUP_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("governance-setup-claim-discipline").textContent).toContain(
      GOVERNANCE_SETUP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByText(GOVERNANCE_SETUP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-first-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-intro")).toHaveTextContent(GOVERNANCE_SETUP_PAGE_LEAD);
    expect(screen.getByTestId("governance-setup-buyer-start-here-helper")).toHaveTextContent(
      GOVERNANCE_SETUP_BUYER_START_HERE_HELPER,
    );
    expect(screen.getByRole("heading", { level: 2, name: GOVERNANCE_SETUP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("governance-setup-config-hubs-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-outcomes-panel")).toHaveTextContent(
      GOVERNANCE_SETUP_OUTCOMES_HEADING,
    );

    const primary = screen.getByTestId("governance-setup-primary-content");
    const orientation = screen.getByTestId("governance-setup-orientation-bottom");
    const stepTrack = screen.getByTestId("governance-setup-step-track");

    expect(primary).toContainElement(orientation);
    expect(stepTrack.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
