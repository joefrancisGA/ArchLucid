import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceApprovalStatusBanner } from "@/components/governance/GovernanceApprovalStatusBanner";
import type { GovernanceApprovalProvenance } from "@/lib/governance/governance-approval-provenance";

const sampleProvenance: GovernanceApprovalProvenance = {
  approverLabel: "Jordan Lee",
  approvedAtUtc: "2026-01-14T22:05:00.000Z",
  scopeLabel: "Claims Intake Demo",
  recordId: "approval-claims-intake-001",
};

describe("GovernanceApprovalStatusBanner", () => {
  it("renders provenance lines and calm action links without aria-live status semantics", () => {
    render(<GovernanceApprovalStatusBanner provenance={sampleProvenance} onRiskRegisterPage />);

    const banner = screen.getByTestId("governance-approval-status-banner");
    expect(banner.tagName.toLowerCase()).toBe("section");
    expect(banner).not.toHaveAttribute("role");
    expect(screen.getByText("Resolve outcome record")).toBeInTheDocument();
    expect(screen.getByText("Approver: Jordan Lee")).toBeInTheDocument();
    expect(screen.getByText(/Scope: Claims Intake Demo/)).toBeInTheDocument();
    expect(screen.getByText(/Record: approval-claims-intake-001/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View approval record" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View approval" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View audit trail" })).toBeInTheDocument();
    expect(screen.queryByText(/Approved for planning use with monitored PHI minimization control/)).not.toBeInTheDocument();
    expect(screen.queryByText(/→/)).not.toBeInTheDocument();
  });

  it("renders nothing when provenance is missing or incomplete", () => {
    const { container: missing } = render(<GovernanceApprovalStatusBanner />);
    expect(missing).toBeEmptyDOMElement();

    const { container: incomplete } = render(
      <GovernanceApprovalStatusBanner
        provenance={{
          approverLabel: "",
          approvedAtUtc: "2026-01-14T22:05:00.000Z",
          scopeLabel: "Claims Intake Demo",
          recordId: "approval-claims-intake-001",
        }}
      />,
    );
    expect(incomplete).toBeEmptyDOMElement();
  });

  it("includes approval link when not on the risk register page", () => {
    render(<GovernanceApprovalStatusBanner provenance={sampleProvenance} />);

    expect(screen.getByRole("link", { name: "View approval" })).toHaveAttribute("href", "/governance/findings");
    expect(screen.getByRole("link", { name: "View approval record" })).toHaveAttribute(
      "href",
      "/governance/approval-queue",
    );
    expect(screen.getByRole("link", { name: "View audit trail" })).toHaveAttribute("href", "/governance/audit");
  });

  it("links assigned-to-me child route to the tenant findings queue without showcase run ids", () => {
    render(<GovernanceApprovalStatusBanner provenance={sampleProvenance} onAssignedToMeFindingsPage />);

    expect(screen.getByRole("link", { name: "Open findings queue" })).toHaveAttribute("href", "/governance/findings");
    expect(screen.getByRole("link", { name: "View approval record" })).toHaveAttribute(
      "href",
      "/governance/approval-queue",
    );
    expect(screen.getByRole("link", { name: "View audit trail" })).toHaveAttribute("href", "/governance/audit");
  });
});
