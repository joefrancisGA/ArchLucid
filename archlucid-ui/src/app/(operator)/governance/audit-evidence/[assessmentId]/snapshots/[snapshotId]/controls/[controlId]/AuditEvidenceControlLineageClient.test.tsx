import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useAuditEvidenceLineageQueryMock = vi.hoisted(() => vi.fn());
const refetchMock = vi.fn();
const downloadAuditEvidencePackageZipMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@/hooks/use-audit-evidence-lineage-query", () => ({
  useAuditEvidenceLineageQuery: (...args: unknown[]) => useAuditEvidenceLineageQueryMock(...args),
}));

vi.mock("@/lib/governance/audit-evidence-package-api", () => ({
  downloadAuditEvidencePackageZip: (...args: unknown[]) => downloadAuditEvidencePackageZipMock(...args),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/audit-evidence/a/s/c",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => false,
  useProductionDeskChrome: (): boolean => true,
}));

import { AuditEvidenceControlLineageClient } from "./AuditEvidenceControlLineageClient";

const ids = {
  assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  snapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
};

describe("AuditEvidenceControlLineageClient", () => {
  it("renders error state when lineage fetch fails", () => {
    useAuditEvidenceLineageQueryMock.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      refetch: refetchMock,
    });

    render(<AuditEvidenceControlLineageClient {...ids} />);

    expect(screen.getByTestId("audit-evidence-lineage-error")).toBeInTheDocument();
  });

  it("expands chain by default in working mode and collapses when toggled", () => {
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
                cloudResourceId: "11111111-1111-1111-1111-111111111111",
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
      refetch: refetchMock,
    });

    render(<AuditEvidenceControlLineageClient {...ids} />);

    expect(screen.getByTestId("audit-evidence-lineage-spine")).toBeInTheDocument();
    expect(screen.queryAllByTestId("audit-evidence-lineage-status-tag")).toHaveLength(1);
    expect(screen.getByTestId("audit-evidence-lineage-evaluation-context")).toHaveTextContent(
      "Technically supported",
    );
    expect(screen.getByTestId("audit-evidence-lineage-hash-summary")).toHaveTextContent(
      "1/1 evidence hashes verified",
    );
    expect(screen.getByTestId("audit-evidence-lineage-back-to-lookup-header")).toHaveAttribute(
      "href",
      "/governance/audit-evidence",
    );
    expect(screen.getByTestId("audit-evidence-spine-resource-hub-ev-1")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=audit&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );

    fireEvent.click(screen.getByTestId("audit-evidence-positive-checkbox"));

    expect(screen.getByTestId("audit-evidence-lineage-collapsed")).toBeInTheDocument();
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
      refetch: refetchMock,
    });

    render(<AuditEvidenceControlLineageClient {...ids} />);

    expect(screen.getByTestId("audit-evidence-broken-link-reasons")).toHaveTextContent("Snapshot hash unverified");
    expect(screen.getByTestId("audit-evidence-missing-links-ev-2")).toHaveTextContent("Raw API blob");
  });

  it("announces successful evidence bundle download", async () => {
    useAuditEvidenceLineageQueryMock.mockReturnValue({
      data: {
        controlNumber: "AC-1",
        controlTitle: "Access control",
        readyForPositiveCheckbox: true,
        snapshotHashVerified: true,
        brokenLinkReasons: [],
        requirementChains: [],
      },
      isError: false,
      isPending: false,
      refetch: refetchMock,
    });

    render(<AuditEvidenceControlLineageClient {...ids} />);

    fireEvent.click(screen.getByTestId("audit-evidence-package-download"));

    await waitFor(() => {
      expect(screen.getByTestId("audit-evidence-lineage-live-region")).toHaveTextContent(
        "Snapshot evidence bundle downloaded.",
      );
    });
  });

  it("announces clipboard copy failures in the live region", async () => {
    const writeText = vi.fn(async () => {
      throw new Error("denied");
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    useAuditEvidenceLineageQueryMock.mockReturnValue({
      data: {
        controlNumber: "AC-1",
        controlTitle: "Access control",
        readyForPositiveCheckbox: true,
        snapshotHashVerified: true,
        brokenLinkReasons: [],
        requirementChains: [],
      },
      isError: false,
      isPending: false,
      refetch: refetchMock,
    });

    render(<AuditEvidenceControlLineageClient {...ids} />);

    fireEvent.click(screen.getByTestId("audit-evidence-lineage-copy-link"));

    await waitFor(() => {
      expect(screen.getByTestId("audit-evidence-lineage-live-region")).toHaveTextContent(
        "Could not copy lineage link",
      );
    });
  });

  it("shows an inline error instead of a toast when evidence package download fails", async () => {
    downloadAuditEvidencePackageZipMock.mockRejectedValueOnce(new Error("Package export unavailable in this environment."));
    useAuditEvidenceLineageQueryMock.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: false,
      refetch: refetchMock,
    });

    render(<AuditEvidenceControlLineageClient {...ids} />);

    fireEvent.click(screen.getByTestId("audit-evidence-package-download"));

    await waitFor(() => {
      expect(screen.getByTestId("audit-evidence-package-download-error")).toHaveTextContent(
        "Audit evidence bundle download failed",
      );
    });
    expect(screen.getByTestId("audit-evidence-package-download-error")).toHaveTextContent(
      "Package export unavailable in this environment.",
    );
  });
});
