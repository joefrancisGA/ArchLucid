import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceSetupGuidePageView } from "@/app/(operator)/governance/setup/_sections/GovernanceSetupGuidePageView";
import {
  GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
  GOVERNANCE_SETUP_GUIDE_STEPS,
} from "@/app/(operator)/governance/setup/_sections/governance-setup-guide-steps";
import {
  GOVERNANCE_SETUP_OUTCOMES_HEADING,
  GOVERNANCE_SETUP_PAGE_SUBTITLE,
} from "@/lib/governance-setup-route";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance-route-paths";

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

    expect(screen.getByTestId("governance-setup-page-title")).toHaveTextContent("Governance setup");
    expect(screen.getByText(GOVERNANCE_SETUP_PAGE_SUBTITLE)).toBeInTheDocument();
    // TB-1135: no orphan program chip competing with the H1 product name.
    expect(screen.queryByText("First 30 days")).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-progress-summary")).toHaveTextContent("0 of 5 completed");
    expect(screen.getByTestId("governance-setup-progress-coach")).toHaveTextContent(
      "Start with “Set the policy baseline” below.",
    );
    expect(screen.getByTestId("governance-setup-configuration-note")).toHaveTextContent(
      "This guide links to the existing ArchLucid configuration areas.",
    );
    expect(screen.getByTestId("governance-setup-outcomes-panel")).toHaveTextContent(
      GOVERNANCE_SETUP_OUTCOMES_HEADING,
    );
    expect(screen.getByTestId("governance-setup-step-1-outcome")).toHaveTextContent("Outcome:");
    expect(screen.queryByText(/inspect-first/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/deep links only/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-step-track")).toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-recommended-step")).toHaveTextContent("Set the policy baseline");
    expect(screen.getByRole("link", { name: "Configure policy packs" })).toHaveAttribute(
      "href",
      "/governance/policy-packs",
    );
    expect(screen.getByRole("link", { name: "Open workspace overview" })).toHaveAttribute(
      "href",
      GOVERNANCE_WORKSPACE_HEALTH_HREF,
    );
    // TB-1137: only recommended-next carries primary CTA weight; future steps are outline.
    expect(screen.getByTestId("governance-setup-step-1-cta")).toHaveAttribute("data-cta-variant", "primary");
    expect(screen.getByTestId("governance-setup-step-2-cta")).toHaveAttribute("data-cta-variant", "outline");
    expect(screen.getByTestId("governance-setup-step-5-cta")).toHaveAttribute("data-cta-variant", "outline");
    expect(screen.getAllByText("Not started")).toHaveLength(1);
    // TB-1138: no all-Pending foundation theater under an untouched checklist.
    expect(screen.queryByTestId("governance-setup-foundation-panel")).not.toBeInTheDocument();
    expect(screen.queryByText("Governance foundation")).not.toBeInTheDocument();
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
  });

  it("keeps status badges on active steps and demotes non-recommended CTAs", () => {
    render(
      <GovernanceSetupGuidePageView
        model={{
          steps: GOVERNANCE_SETUP_GUIDE_STEPS,
          foundationIndicators: GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
          stepStatuses: ["complete", "in-progress", "not-started", "not-started", "not-started"],
        }}
      />,
    );

    expect(screen.getByTestId("governance-setup-progress-summary")).toHaveTextContent("1 of 5 completed");
    expect(screen.getByTestId("governance-setup-progress-coach")).toHaveTextContent(
      "Next: Validate threshold impact",
    );
    // Step row + foundation indicator for the completed baseline step.
    expect(screen.getAllByText("Complete")).toHaveLength(2);
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.queryByText("Not started")).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-step-1-cta")).toHaveAttribute("data-cta-variant", "outline");
    expect(screen.getByTestId("governance-setup-step-2-cta")).toHaveAttribute("data-cta-variant", "primary");
    expect(screen.getByRole("link", { name: "Check connector readiness" })).toHaveAttribute(
      "href",
      "/administration/connection-status",
    );
    // TB-1138: foundation panel appears once a mapped indicator is complete.
    expect(screen.getByTestId("governance-setup-foundation-panel")).toBeInTheDocument();
  });
});
