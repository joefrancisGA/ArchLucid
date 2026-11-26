import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useAuditEvidenceLineageQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-audit-evidence-lineage-query", () => ({
  useAuditEvidenceLineageQuery: (...args: unknown[]) => useAuditEvidenceLineageQueryMock(...args),
}));

vi.mock("@/lib/governance/audit-evidence-package-api", () => ({
  downloadAuditEvidencePackageZip: vi.fn(async () => undefined),
}));

vi.mock("next/navigation", () => ({
  usePathname: () =>
    "/compliance/audit-evidence/assessment-1/snapshots/snapshot-1/controls/control-1",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => false,
  useProductionDeskChrome: (): boolean => true,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

import { AuditEvidenceControlLineageClient } from "./AuditEvidenceControlLineageClient";

describe("AuditEvidenceControlLineageClient SecureNow compliance (COO)", () => {
  it("renders compliance wayfinding and primary main focus target", () => {
    useAuditEvidenceLineageQueryMock.mockReturnValue({
      data: {
        controlNumber: "AC-2",
        controlTitle: "Account management",
        readyForPositiveCheckbox: true,
        snapshotHashVerified: true,
        brokenLinkReasons: [],
        requirementChains: [],
      },
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    });

    render(
      <AuditEvidenceControlLineageClient
        assessmentId="assessment-1"
        snapshotId="snapshot-1"
        controlId="control-1"
      />,
    );

    expect(screen.getByTestId("compliance-control-lineage-wayfinding")).toHaveTextContent(
      "Audit evidence lookup",
    );
    expect(screen.getByTestId("audit-evidence-control-lineage-primary-content")).toHaveAttribute(
      "tabIndex",
      "-1",
    );
    expect(screen.getByTestId("audit-evidence-lineage-back-to-lookup-header")).toHaveAttribute(
      "href",
      "/compliance/audit-evidence",
    );
  });
});