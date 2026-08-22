import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceJobRouterStrip } from "@/components/governance/GovernanceJobRouterStrip";
import {
  GOVERNANCE_JOB_APPROVE_GOVERNANCE,
  GOVERNANCE_JOB_RECORD_DECISIONS,
  GOVERNANCE_JOB_ROUTER_HEADING,
  GOVERNANCE_JOB_TRIAGE_FINDINGS,
  getGovernanceJobRouter,
} from "@/lib/governance/governance-job-router";

describe("GovernanceJobRouterStrip (TB-2199 / TB-2230)", () => {
  it("renders chooser with SoT heading and all three job options", () => {
    render(<GovernanceJobRouterStrip currentJobId="triage-findings" />);

    const strip = screen.getByTestId("governance-job-router");
    expect(strip).toHaveAttribute("data-current-job", "triage-findings");
    expect(strip).toHaveAttribute("data-layout", "default");
    expect(screen.getByText(GOVERNANCE_JOB_ROUTER_HEADING)).toBeInTheDocument();

    const approve = screen.getByTestId("governance-job-router-option-approve-governance");
    const triage = screen.getByTestId("governance-job-router-option-triage-findings");
    const decisions = screen.getByTestId("governance-job-router-option-record-decisions");

    expect(triage).toHaveAttribute("data-current", "true");
    expect(triage).toHaveAttribute("aria-current", "page");
    expect(triage).toHaveAttribute("aria-labelledby", "governance-job-router-option-triage-findings-title");
    expect(triage).toHaveAttribute("aria-describedby", "governance-job-router-option-triage-findings-description");
    expect(triage.tagName.toLowerCase()).toBe("a");
    expect(triage).toHaveTextContent(GOVERNANCE_JOB_TRIAGE_FINDINGS.label);
    expect(triage).toHaveTextContent(GOVERNANCE_JOB_TRIAGE_FINDINGS.whenToUse);

    expect(approve).toHaveAttribute("data-current", "false");
    expect(approve.tagName.toLowerCase()).toBe("a");
    expect(approve).toHaveAttribute("href", GOVERNANCE_JOB_APPROVE_GOVERNANCE.href);
    expect(approve).toHaveTextContent(GOVERNANCE_JOB_APPROVE_GOVERNANCE.label);

    expect(decisions).toHaveAttribute("data-current", "false");
    expect(decisions.tagName.toLowerCase()).toBe("a");
    expect(decisions).toHaveAttribute("href", GOVERNANCE_JOB_RECORD_DECISIONS.href);
    expect(decisions).toHaveTextContent(GOVERNANCE_JOB_RECORD_DECISIONS.label);
  });

  it("marks approve-governance current on the Approval queue surface", () => {
    render(<GovernanceJobRouterStrip currentJobId="approve-governance" />);

    expect(screen.getByTestId("governance-job-router")).toHaveAttribute(
      "data-current-job",
      "approve-governance",
    );
    expect(screen.getByTestId("governance-job-router-option-approve-governance")).toHaveAttribute(
      "data-current",
      "true",
    );
    expect(screen.getByTestId("governance-job-router-option-triage-findings")).toHaveAttribute(
      "href",
      GOVERNANCE_JOB_TRIAGE_FINDINGS.href,
    );
    expect(screen.getByTestId("governance-job-router-option-record-decisions")).toHaveAttribute(
      "href",
      GOVERNANCE_JOB_RECORD_DECISIONS.href,
    );
  });

  it("marks record-decisions current on the Decision register surface", () => {
    render(<GovernanceJobRouterStrip currentJobId="record-decisions" />);

    expect(screen.getByTestId("governance-job-router")).toHaveAttribute(
      "data-current-job",
      "record-decisions",
    );
    expect(screen.getByTestId("governance-job-router-option-record-decisions")).toHaveAttribute(
      "data-current",
      "true",
    );
    expect(screen.getByTestId("governance-job-router-option-triage-findings")).toHaveAttribute(
      "href",
      GOVERNANCE_JOB_TRIAGE_FINDINGS.href,
    );
    expect(screen.getByTestId("governance-job-router-option-approve-governance")).toHaveAttribute(
      "href",
      GOVERNANCE_JOB_APPROVE_GOVERNANCE.href,
    );
  });

  it("accepts a router override for tests", () => {
    const base = getGovernanceJobRouter();

    render(
      <GovernanceJobRouterStrip
        currentJobId="triage-findings"
        router={{
          heading: "Custom governance job chooser",
          options: base.options,
        }}
      />,
    );

    expect(screen.getByText("Custom governance job chooser")).toBeInTheDocument();
  });

  it("uses compact layout to hide the current job card and expose keyboard-reachable links", () => {
    render(<GovernanceJobRouterStrip currentJobId="assigned-to-me-findings" layout="compact" />);

    const strip = screen.getByTestId("governance-job-router");
    expect(strip).toHaveAttribute("data-layout", "compact");
    expect(screen.queryByTestId("governance-job-router-option-assigned-to-me-findings")).not.toBeInTheDocument();
    expect(screen.getByText("Other approval queues")).toBeInTheDocument();

    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("link")).toHaveLength(3);
    expect(screen.getByTestId("governance-job-router-option-triage-findings").tagName.toLowerCase()).toBe("a");
    expect(screen.getByTestId("governance-job-router-option-approve-governance").tagName.toLowerCase()).toBe("a");
    expect(screen.getByTestId("governance-job-router-option-record-decisions").tagName.toLowerCase()).toBe("a");
  });
});
