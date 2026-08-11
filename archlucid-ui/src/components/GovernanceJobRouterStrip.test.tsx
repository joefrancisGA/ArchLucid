import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceJobRouterStrip } from "@/components/GovernanceJobRouterStrip";
import {
  GOVERNANCE_JOB_RECORD_DECISIONS,
  GOVERNANCE_JOB_ROUTER_HEADING,
  GOVERNANCE_JOB_TRIAGE_FINDINGS,
  getGovernanceJobRouter,
} from "@/lib/governance-job-router";

describe("GovernanceJobRouterStrip (TB-2199)", () => {
  it("renders chooser with SoT heading and both job options", () => {
    render(<GovernanceJobRouterStrip currentJobId="triage-findings" />);

    const strip = screen.getByTestId("governance-job-router");
    expect(strip).toHaveAttribute("data-current-job", "triage-findings");
    expect(screen.getByText(GOVERNANCE_JOB_ROUTER_HEADING)).toBeInTheDocument();

    const triage = screen.getByTestId("governance-job-router-option-triage-findings");
    const decisions = screen.getByTestId("governance-job-router-option-record-decisions");

    expect(triage).toHaveAttribute("data-current", "true");
    expect(triage).toHaveAttribute("aria-current", "page");
    expect(triage.tagName.toLowerCase()).toBe("div");
    expect(triage).toHaveTextContent(GOVERNANCE_JOB_TRIAGE_FINDINGS.label);
    expect(triage).toHaveTextContent(GOVERNANCE_JOB_TRIAGE_FINDINGS.whenToUse);

    expect(decisions).toHaveAttribute("data-current", "false");
    expect(decisions.tagName.toLowerCase()).toBe("a");
    expect(decisions).toHaveAttribute("href", GOVERNANCE_JOB_RECORD_DECISIONS.href);
    expect(decisions).toHaveTextContent(GOVERNANCE_JOB_RECORD_DECISIONS.label);
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
});