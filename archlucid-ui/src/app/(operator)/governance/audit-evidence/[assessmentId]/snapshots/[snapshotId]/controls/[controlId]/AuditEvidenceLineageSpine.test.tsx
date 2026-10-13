import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuditEvidenceLineageSpine } from "./AuditEvidenceLineageSpine";
import type { AuditEvidenceLineageRecord } from "@/lib/audit-evidence-lineage-types";
import { buildRemediationWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-workbench-url";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/audit-evidence",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("AuditEvidenceLineageSpine", () => {
  it("labels omitted lineage identifiers without changing stored blanks", () => {
    const lineage: AuditEvidenceLineageRecord = {
      controlTitle: "Control title",
      requirementChains: [
        {
          requirementId: "requirement-1",
          requirementName: undefined,
          evidenceType: "Document",
          evidence: [
            {
              evidenceRowId: "evidence-1",
              collectorVersion: undefined,
              selectorVersion: undefined,
              linkComplete: true,
              itemHashVerified: true,
            },
          ],
        },
      ],
    };

    const { rerender } = render(
      <AuditEvidenceLineageSpine
        lineage={lineage}
        expanded
        lineageContext={{
          assessmentId: "assessment-1",
          auditEvidenceSnapshotId: "snapshot-1",
          controlId: "control-1",
        }}
      />,
    );

    expect(screen.getByText(/Control number was not stored\./)).toBeInTheDocument();
    expect(screen.getByText(/Requirement name was not stored\./)).toBeInTheDocument();
    expect(screen.getByText(/Collector version was not stored\./)).toBeInTheDocument();
    expect(screen.getByText(/Selector version was not stored\./)).toBeInTheDocument();

    rerender(
      <AuditEvidenceLineageSpine
        lineage={{
          ...lineage,
          controlNumber: "",
          requirementChains: [
            {
              ...lineage.requirementChains![0],
              requirementName: "",
              evidence: [{ ...lineage.requirementChains![0]!.evidence![0], collectorVersion: "", selectorVersion: "" }],
            },
          ],
        }}
        expanded
        lineageContext={{
          assessmentId: "assessment-1",
          auditEvidenceSnapshotId: "snapshot-1",
          controlId: "control-1",
        }}
      />,
    );

    expect(screen.queryByText(/Control number was not stored\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Requirement name was not stored\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Collector version was not stored\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Selector version was not stored\./)).not.toBeInTheDocument();
  });

  it("renders a remediation tracker link for verified remediation associations", () => {
    const instanceId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const lineage: AuditEvidenceLineageRecord = {
      controlTitle: "Control title",
      verifiedRemediationAssociations: [
        {
          associationId: "assoc-1",
          instanceId,
          status: "Verified",
          verificationSnapshotId: "11111111-1111-1111-1111-111111111111",
          controlId: "SC-28",
        },
      ],
      requirementChains: [],
    };

    render(
      <AuditEvidenceLineageSpine
        lineage={lineage}
        expanded
        lineageContext={{
          assessmentId: "assessment-1",
          auditEvidenceSnapshotId: "snapshot-1",
          controlId: "control-1",
        }}
      />,
    );

    const link = screen.getByTestId(`audit-evidence-spine-verified-remediation-link-${instanceId}`);

    expect(link).toHaveAttribute(
      "href",
      buildRemediationWorkbenchHref({ instanceId }),
    );
    expect(screen.queryByTestId("audit-evidence-positive-checkbox")).not.toBeInTheDocument();
  });

  it("does not render verified remediation rows when the association list is empty", () => {
    const lineage: AuditEvidenceLineageRecord = {
      controlTitle: "Control title",
      verifiedRemediationAssociations: [],
      requirementChains: [],
    };

    render(
      <AuditEvidenceLineageSpine
        lineage={lineage}
        expanded
        lineageContext={{
          assessmentId: "assessment-1",
          auditEvidenceSnapshotId: "snapshot-1",
          controlId: "control-1",
        }}
      />,
    );

    expect(screen.queryByTestId(/audit-evidence-spine-verified-remediation-/)).not.toBeInTheDocument();
  });
});
