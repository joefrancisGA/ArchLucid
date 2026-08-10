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
  it("shows pre-commit honesty, one primary CTA, and claim discipline without Sources (TB-1857 / TB-1859 / TB-1860 / TB-2092)", () => {
    render(<RunDetailGovernanceDecisionSection {...baseProps} manifestId={null} />);

    expect(screen.getByTestId("run-detail-governance-decision")).toHaveAttribute("data-package-committed", "false");
    expect(screen.getByText(/after you finalize this architecture review/i)).toBeInTheDocument();
    expect(screen.queryByText("Record governance decision")).not.toBeInTheDocument();
    expect(screen.queryByText("No governance decision recorded")).not.toBeInTheDocument();

    const primary = screen.getByTestId("run-detail-governance-primary-cta");

    expect(primary).toHaveAttribute("href", expect.stringContaining("archTab=findings"));
    expect(primary).toHaveTextContent("Review findings");

    const secondary = screen.getByTestId("run-detail-governance-secondary-cta");

    expect(secondary.tagName.toLowerCase()).toBe("a");
    expect(secondary.getAttribute("href") ?? "").toContain("archTab=activity");
    expect(screen.queryByRole("button", { name: "View assessment activity" })).not.toBeInTheDocument();

    expect(screen.queryByTestId("run-detail-governance-sources")).toBeNull(); // TB-2092
    expect(screen.getByTestId("run-detail-governance-claim-discipline")).toHaveTextContent(/not the committed/i);
  });

  it("shows post-commit governance decision chrome when manifest exists", () => {
    render(<RunDetailGovernanceDecisionSection {...baseProps} manifestId="manifest-1" />);

    expect(screen.getByTestId("review-governance-secondary-view-strip")).toBeInTheDocument();
    expect(screen.getByText("Governance decision")).toBeInTheDocument();
    expect(screen.getByText("No governance decision recorded")).toBeInTheDocument();
    expect(screen.queryByText(/after you finalize this architecture package/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("run-detail-governance-sources")).not.toBeInTheDocument();

    const blockingLink = screen.getByRole("link", { name: "2" });

    expect(blockingLink.getAttribute("href") ?? "").toContain("archTab=findings");
  });
});
