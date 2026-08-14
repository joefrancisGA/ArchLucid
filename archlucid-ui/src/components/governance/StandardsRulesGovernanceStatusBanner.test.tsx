import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StandardsRulesGovernanceStatusBanner } from "@/components/governance/StandardsRulesGovernanceStatusBanner";

const sampleHrefs = {
  sealedRecordHref: "/signed-records/demo",
  evidenceTrailHref: "/insights/evidence-graph?runId=demo",
  auditTrailHref: "/governance/audit?runId=demo",
};

const sampleProvenance = {
  approverLabel: "Jordan Lee",
  approvedAtUtc: "2026-01-14T22:05:00.000Z",
  scopeLabel: "Customer Intake Demo",
  recordId: "claims-intake-approval-001",
};

describe("StandardsRulesGovernanceStatusBanner", () => {
  it("renders subject, approver, timestamp, disclosure record id, and calm links", () => {
    render(
      <StandardsRulesGovernanceStatusBanner
        subjectLabel="Enterprise Customer Intake Modernization Review"
        provenance={sampleProvenance}
        hrefs={sampleHrefs}
      />,
    );

    expect(screen.getByTestId("standards-rules-governance-status-banner")).toBeInTheDocument();
    expect(screen.getByText("Governance approval record")).toBeInTheDocument();
    expect(screen.getByText(/Enterprise Customer Intake Modernization Review/)).toBeInTheDocument();
    expect(screen.getByText(/Approver:/)).toBeInTheDocument();
    expect(screen.getByText(/Jordan Lee/)).toBeInTheDocument();
    expect(screen.getByText(/Approved:/)).toBeInTheDocument();
    expect(screen.getByText(/claims-intake-approval-001/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View sealed review record" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View evidence trail" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View audit trail" })).toBeInTheDocument();
    expect(screen.queryByText(/→/)).not.toBeInTheDocument();
  });
});
