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
  it("shows pre-commit readiness, finalize CTA, help cites, and claim discipline (TB-1857 / TB-2092)", () => {
    render(<RunDetailGovernanceDecisionSection {...baseProps} manifestId={null} />);

    expect(screen.getByTestId("run-detail-governance-decision")).toHaveAttribute("data-package-committed", "false");
    expect(screen.getByRole("heading", { name: "Governance after finalize" })).toBeInTheDocument();
    expect(screen.queryByText("Record governance decision")).not.toBeInTheDocument();
    expect(screen.queryByText("No governance decision recorded")).not.toBeInTheDocument();
    expect(screen.getByText("What happens next")).toBeInTheDocument();
    expect(screen.queryByText("Awaiting decision")).not.toBeInTheDocument();

    const primary = screen.getByTestId("run-detail-governance-primary-cta");

    expect(primary).toHaveAttribute("href", expect.stringContaining("reviewTab=activity"));
    expect(primary.getAttribute("href") ?? "").toContain("architecture-assessment-progress");
    expect(primary).toHaveTextContent("Review finalize readiness");

    const secondary = screen.getByTestId("run-detail-governance-secondary-cta");

    expect(secondary.tagName.toLowerCase()).toBe("a");
    expect(secondary.getAttribute("href") ?? "").toContain("reviewTab=activity");
    expect(screen.queryByRole("button", { name: "View assessment activity" })).not.toBeInTheDocument();

    const blockingLink = screen.getByRole("link", { name: "2" });

    expect(blockingLink.getAttribute("href") ?? "").toContain("reviewTab=findings");

    expect(screen.queryByTestId("run-detail-governance-sources")).toBeNull();
    expect(screen.getByTestId("run-detail-governance-help-cites")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Governance approval help" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Audit trail help" })).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-governance-claim-discipline")).toHaveTextContent(
      /Where governance decisions are recorded/i,
    );
    expect(screen.getByTestId("run-detail-governance-claim-discipline")).toHaveTextContent(/not the committed/i);
  });

  it("demotes in-section governance CTAs to outline when Do this next owns the page primary", () => {
    render(
      <RunDetailGovernanceDecisionSection
        {...baseProps}
        manifestId={null}
        pagePrimaryOwnedElsewhere
      />,
    );

    expect(screen.getByTestId("run-detail-governance-primary-cta")).toHaveClass(
      "border-neutral-300",
    );
  });

  it("demotes post-finalize record decision CTA when Do this next owns the page primary", () => {
    render(
      <RunDetailGovernanceDecisionSection
        {...baseProps}
        manifestId="manifest-1"
        buyerPolishedArtifactTable={false}
        operatorGovernanceDecision={null}
        manifestStatus="Draft"
        pagePrimaryOwnedElsewhere
      />,
    );

    expect(screen.getByTestId("run-detail-governance-record-decision-cta")).toHaveClass(
      "border-neutral-300",
    );
  });

  it("shows open exceptions and warning banner when governance warnings are present", () => {
    render(
      <RunDetailGovernanceDecisionSection
        {...baseProps}
        manifestId={null}
        blockingFindingCount={0}
        hasGovernanceWarnings
      />,
    );

    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-governance-warning-banner")).toBeInTheDocument();
  });

  it("shows post-commit governance decision chrome when manifest exists", () => {
    render(<RunDetailGovernanceDecisionSection {...baseProps} manifestId="manifest-1" />);

    expect(screen.getByTestId("review-governance-secondary-view-strip")).toBeInTheDocument();
    expect(screen.getByText("Governance decision")).toBeInTheDocument();
    expect(screen.getByText("No governance decision recorded")).toBeInTheDocument();
    expect(screen.queryByText(/after you finalize this architecture package/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("run-detail-governance-sources")).not.toBeInTheDocument();

    const blockingLink = screen.getByRole("link", { name: "2" });

    expect(blockingLink.getAttribute("href") ?? "").toContain("reviewTab=findings");
  });
});
