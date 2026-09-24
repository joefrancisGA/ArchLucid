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
  usePathname: () => "/governance/audit-evidence/assessment-1/snapshots/snapshot-1/controls/control-1",
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
  useProductLine: () => ({ productLine: "architecture" }),
}));

import {
  AUDIT_EVIDENCE_CONTROL_LINEAGE_CLAIM_DISCIPLINE,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PRIMARY_CONTENT_ID,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_SKIP_LINK_LABEL,
} from "@/lib/audit-evidence-page-copy";
import { AuditEvidenceControlLineageClient } from "./AuditEvidenceControlLineageClient";

describe("AuditEvidenceControlLineageClient working mode", () => {
  it("renders skip link, claim discipline, breadcrumb, and orientation strip", () => {
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

    expect(screen.getByRole("link", { name: AUDIT_EVIDENCE_CONTROL_LINEAGE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUDIT_EVIDENCE_CONTROL_LINEAGE_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("audit-evidence-control-lineage-claim-discipline")).toHaveTextContent(
      AUDIT_EVIDENCE_CONTROL_LINEAGE_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("audit-evidence-control-lineage-primary-content")).toHaveAttribute(
      "id",
      AUDIT_EVIDENCE_CONTROL_LINEAGE_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("audit-evidence-control-lineage-sources")).toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-lineage-back-to-lookup-header")).toHaveAttribute(
      "href",
      "/governance/audit-evidence",
    );
    expect(screen.getByTestId("audit-evidence-lineage-spine")).toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-lineage-route-identifiers")).toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-package-download")).toHaveAttribute(
      "aria-describedby",
      "audit-evidence-package-download-scope-note",
    );
    expect(screen.getByTestId("audit-evidence-control-lineage-keyboard-affordance")).toHaveTextContent("Alt+1");
  });
});
