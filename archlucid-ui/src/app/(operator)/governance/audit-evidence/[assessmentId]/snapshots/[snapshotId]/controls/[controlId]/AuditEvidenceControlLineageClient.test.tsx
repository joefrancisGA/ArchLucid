import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useAuditEvidenceLineageQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-audit-evidence-lineage-query", () => ({
  useAuditEvidenceLineageQuery: (...args: unknown[]) => useAuditEvidenceLineageQueryMock(...args),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/audit-evidence/a/s/c",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

import { AuditEvidenceControlLineageClient } from "./AuditEvidenceControlLineageClient";

const ids = {
  assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  snapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
};

describe("AuditEvidenceControlLineageClient", () => {
  it("renders error state when lineage fetch fails", () => {
    useAuditEvidenceLineageQueryMock.mockReturnValue({ data: undefined, isError: true, isPending: false });

    render(<AuditEvidenceControlLineageClient {...ids} />);

    expect(screen.getByTestId("audit-evidence-lineage-error")).toBeInTheDocument();
  });

  it("expands chain when supported checkbox is clicked", () => {
    useAuditEvidenceLineageQueryMock.mockReturnValue({
      data: {
        controlNumber: "AC-1",
        controlTitle: "Access control",
        readyForPositiveCheckbox: true,
        snapshotHashVerified: true,
        brokenLinkReasons: [],
        evaluation: {
          evaluationId: "eval-1",
          outcome: "TechnicallySupported",
          formula: "1/1 pass",
        },
        requirementChains: [
          {
            requirementId: "req-1",
            requirementName: "Network evidence",
            evidenceType: "Network",
            evidence: [
              {
                evidenceRowId: "ev-1",
                linkComplete: true,
                itemHashVerified: true,
                missingLinkKinds: [],
              },
            ],
          },
        ],
      },
      isError: false,
      isPending: false,
    });

    render(<AuditEvidenceControlLineageClient {...ids} />);

    expect(screen.getByTestId("audit-evidence-lineage-collapsed")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("audit-evidence-positive-checkbox"));

    expect(screen.getByTestId("audit-evidence-lineage-spine")).toBeInTheDocument();
  });

  it("shows broken links when chain is incomplete", () => {
    useAuditEvidenceLineageQueryMock.mockReturnValue({
      data: {
        controlNumber: "AC-2",
        controlTitle: "Logging",
        readyForPositiveCheckbox: false,
        snapshotHashVerified: false,
        brokenLinkReasons: ["Snapshot hash unverified"],
        evaluation: {
          evaluationId: "eval-2",
          outcome: "InsufficientEvidence",
        },
        requirementChains: [
          {
            requirementId: "req-2",
            requirementName: "Log retention",
            evidence: [
              {
                evidenceRowId: "ev-2",
                linkComplete: false,
                itemHashVerified: false,
                missingLinkKinds: ["RawApiBlob"],
              },
            ],
          },
        ],
      },
      isError: false,
      isPending: false,
    });

    render(<AuditEvidenceControlLineageClient {...ids} />);

    expect(screen.getByTestId("audit-evidence-broken-link-reasons")).toHaveTextContent("Snapshot hash unverified");
    expect(screen.getByTestId("audit-evidence-missing-links-ev-2")).toHaveTextContent("RawApiBlob");
  });
});
