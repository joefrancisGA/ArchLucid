import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceSetupGuidePageView } from "@/app/(operator)/governance/setup/_sections/GovernanceSetupGuidePageView";
import {
  GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
  GOVERNANCE_SETUP_GUIDE_STEPS,
} from "@/app/(operator)/governance/setup/_sections/governance-setup-guide-steps";
import {
  GOVERNANCE_SETUP_ALL_TRACKED_COMPLETE_COACH,
  GOVERNANCE_SETUP_STEP_NOT_TRACKED_HELPER,
  GOVERNANCE_SETUP_STEP_NOT_TRACKED_STATUS_LABEL,
} from "@/app/(operator)/governance/setup/_sections/governance-setup-progress-copy";
import {
  GOVERNANCE_SETUP_OUTCOMES_HEADING,
  GOVERNANCE_SETUP_PAGE_SUBTITLE,
} from "@/lib/governance/governance-setup-route";
import {
  GOVERNANCE_SETUP_CLAIM_DISCIPLINE,
  GOVERNANCE_SETUP_SOURCES_INTRO,
} from "@/lib/governance/governance-setup-evidence-copy";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import { GOVERNANCE_SETUP_CONFIG_HUBS_COMPACT_LINE } from "@/lib/vocabulary/governance-setup-config-hubs-vocabulary";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

describe("GovernanceSetupGuidePageView", () => {
  it("renders outcome-framed setup copy without implementation jargon", () => {
    render(
      <GovernanceSetupGuidePageView
        model={{
          steps: GOVERNANCE_SETUP_GUIDE_STEPS,
          foundationIndicators: GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
          stepStatuses: ["not-started", "not-started", "not-started", "not-started", "not-started"],
        }}
      />,
    );

    expect(screen.getByTestId("governance-setup-page-title")).toHaveTextContent("Approval setup");
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByText(GOVERNANCE_SETUP_PAGE_SUBTITLE)).toBeInTheDocument();
    // TB-1135: no orphan program chip competing with the H1 product name.
    expect(screen.queryByText("First 30 days")).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-progress-summary")).toHaveTextContent(
      "0 of 2 tracked steps complete",
    );
    expect(screen.getByTestId("governance-setup-progress-summary")).toHaveTextContent(
      "3 steps you confirm yourself",
    );
    expect(screen.getByTestId("governance-setup-progress-coach")).toHaveTextContent(
      "Start with “Set the policy baseline” below.",
    );
    expect(screen.getByTestId("governance-setup-config-hubs-vocabulary").textContent).toContain(
      GOVERNANCE_SETUP_CONFIG_HUBS_COMPACT_LINE,
    );
    expect(screen.queryByTestId("governance-setup-configuration-note")).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-outcomes-panel")).toHaveTextContent(
      GOVERNANCE_SETUP_OUTCOMES_HEADING,
    );
    expect(screen.getByTestId("governance-setup-step-1-outcome")).toHaveTextContent(
      "Reviews evaluate against a shared baseline instead of ad-hoc judgment.",
    );
    expect(screen.queryByText("Outcome:")).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-claim-discipline")).toHaveTextContent(
      GOVERNANCE_SETUP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("governance-setup-sources")).toHaveTextContent(
      GOVERNANCE_SETUP_SOURCES_INTRO,
    );
    expect(screen.queryByText(/inspect-first/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/deep links only/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-step-track")).toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-recommended-step")).toHaveTextContent("Set the policy baseline");
    expect(screen.getByRole("link", { name: "Configure policy packs" })).toHaveAttribute(
      "href",
      "/governance/policy-packs",
    );
    expect(screen.getByRole("link", { name: "Open workspace health" })).toHaveAttribute(
      "href",
      GOVERNANCE_WORKSPACE_HEALTH_HREF,
    );
    // TB-1137: only recommended-next carries primary CTA weight; future steps are outline.
    expect(screen.getByTestId("governance-setup-step-1-cta")).toHaveAttribute("data-cta-variant", "primary");
    expect(screen.getByTestId("governance-setup-step-2-cta")).toHaveAttribute("data-cta-variant", "outline");
    expect(screen.getByTestId("governance-setup-step-5-cta")).toHaveAttribute("data-cta-variant", "outline");
    expect(screen.getAllByText("Not started")).toHaveLength(2);
    expect(screen.getAllByText(GOVERNANCE_SETUP_STEP_NOT_TRACKED_STATUS_LABEL)).toHaveLength(3);
    expect(screen.getAllByText(GOVERNANCE_SETUP_STEP_NOT_TRACKED_HELPER)).toHaveLength(3);
    // TB-1138: no all-Pending foundation theater under an untouched checklist.
    expect(screen.queryByTestId("governance-setup-foundation-panel")).not.toBeInTheDocument();
    expect(screen.queryByText("Governance foundation")).not.toBeInTheDocument();
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
  });

  it("keeps status badges on all steps and recommends the next tracked step", () => {
    render(
      <GovernanceSetupGuidePageView
        model={{
          steps: GOVERNANCE_SETUP_GUIDE_STEPS,
          foundationIndicators: GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
          stepStatuses: ["complete", "in-progress", "not-started", "not-started", "not-started"],
        }}
      />,
    );

    expect(screen.getByTestId("governance-setup-progress-summary")).toHaveTextContent(
      "1 of 2 tracked steps complete",
    );
    expect(screen.getByTestId("governance-setup-progress-coach")).toHaveTextContent(
      "Next: Configure alert ownership",
    );
    // Step row + foundation indicator for the completed baseline step.
    expect(screen.getAllByText("Complete")).toHaveLength(2);
    expect(screen.queryByText("In progress")).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-step-2")).toHaveTextContent(
      GOVERNANCE_SETUP_STEP_NOT_TRACKED_STATUS_LABEL,
    );
    expect(screen.getByTestId("governance-setup-step-1-cta")).toHaveAttribute("data-cta-variant", "outline");
    expect(screen.getByTestId("governance-setup-step-3-cta")).toHaveAttribute("data-cta-variant", "primary");
    expect(screen.getByRole("link", { name: "Check connector readiness" })).toHaveAttribute(
      "href",
      "/administration/connection-status",
    );
    // TB-1138: foundation panel appears once a mapped indicator is complete.
    expect(screen.getByTestId("governance-setup-foundation-panel")).toBeInTheDocument();
    expect(screen.getAllByText(GOVERNANCE_SETUP_STEP_NOT_TRACKED_STATUS_LABEL)).toHaveLength(5);
  });

  it("renders tracked-complete coach when both tracked steps are complete", () => {
    render(
      <GovernanceSetupGuidePageView
        model={{
          steps: GOVERNANCE_SETUP_GUIDE_STEPS,
          foundationIndicators: GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
          stepStatuses: ["complete", "not-started", "complete", "not-started", "not-started"],
        }}
      />,
    );

    expect(screen.getByTestId("governance-setup-progress-summary")).toHaveTextContent(
      "2 of 2 tracked steps complete",
    );
    expect(screen.getByTestId("governance-setup-progress-coach")).toHaveTextContent(
      GOVERNANCE_SETUP_ALL_TRACKED_COMPLETE_COACH,
    );
    expect(screen.queryByTestId("governance-setup-recommended-step")).not.toBeInTheDocument();
  });
});
