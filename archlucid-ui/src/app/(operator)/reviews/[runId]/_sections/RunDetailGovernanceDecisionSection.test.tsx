import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailGovernanceDecisionSection } from "./RunDetailGovernanceDecisionSection";

const baseProps = {
  runId: "run-gov",
  buyerPolishedArtifactTable: false,
  operatorGovernanceDecision: null,
  operatorGovernanceDecisionRationale: null,
  operatorGovernanceDecisionUtc: null,
  operatorGovernanceDecisionByUserId: null,
  manifestStatus: null,
  governanceGateLabel: "Awaiting decision",
  blockingFindingCount: 2,
  hasGovernanceWarnings: false,
};

describe("RunDetailGovernanceDecisionSection", () => {
  it("shows pre-commit honesty on create-home before package finalize (TB-1857)", () => {
    render(<RunDetailGovernanceDecisionSection {...baseProps} manifestId={null} />);

    expect(screen.getByTestId("run-detail-governance-decision")).toHaveAttribute("data-package-committed", "false");
    expect(screen.getByText(/after you finalize this architecture review/i)).toBeInTheDocument();
    expect(screen.queryByText("Record governance decision")).not.toBeInTheDocument();
    expect(screen.queryByText("No governance decision recorded")).not.toBeInTheDocument();

    const findingsLink = screen.getByRole("link", { name: "Review findings" });

    expect(findingsLink.getAttribute("href") ?? "").toContain("archTab=findings");
    expect(findingsLink.getAttribute("href") ?? "").toContain("run-gov");

    const activityLink = screen.getByRole("link", { name: "View assessment activity" });

    expect(activityLink.getAttribute("href") ?? "").toContain("archTab=activity");
  });

  it("shows post-commit governance decision chrome when manifest exists", () => {
    render(<RunDetailGovernanceDecisionSection {...baseProps} manifestId="manifest-1" />);

    expect(screen.getByText("Governance decision")).toBeInTheDocument();
    expect(screen.getByText("No governance decision recorded")).toBeInTheDocument();
    expect(screen.queryByText(/after you finalize this architecture package/i)).not.toBeInTheDocument();
  });
});
