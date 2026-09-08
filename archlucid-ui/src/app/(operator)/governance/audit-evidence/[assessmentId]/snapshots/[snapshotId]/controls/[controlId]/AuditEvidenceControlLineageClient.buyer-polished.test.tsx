import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useAuditEvidenceLineageQueryMock = vi.hoisted(() => vi.fn());
const refetchMock = vi.fn();

vi.mock("@/hooks/use-audit-evidence-lineage-query", () => ({
  useAuditEvidenceLineageQuery: (...args: unknown[]) => useAuditEvidenceLineageQueryMock(...args),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/audit-evidence/a/s/c",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import {
  AUDIT_EVIDENCE_CONTROL_LINEAGE_BACK_TO_LOOKUP_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PRIMARY_CONTENT_ID,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_RETRY_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_SKIP_LINK_LABEL,
} from "@/lib/audit-evidence-page-copy";
import { AuditEvidenceControlLineageClient } from "./AuditEvidenceControlLineageClient";

const ids = {
  assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  snapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
};

describe("AuditEvidenceControlLineageClient buyer-polished chrome", () => {
  it("renders skip link, route identifier disclosure, error retry panel, and sources strip", () => {
    useAuditEvidenceLineageQueryMock.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      refetch: refetchMock,
    });

    render(<AuditEvidenceControlLineageClient {...ids} />);

    expect(screen.getByRole("link", { name: AUDIT_EVIDENCE_CONTROL_LINEAGE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUDIT_EVIDENCE_CONTROL_LINEAGE_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("audit-evidence-control-lineage-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-lineage-route-identifiers")).toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-lineage-error-panel")).toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-control-lineage-sources")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("audit-evidence-lineage-retry"));
    expect(refetchMock).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId("audit-evidence-lineage-back-to-lookup")).toHaveAttribute(
      "href",
      "/governance/audit-evidence",
    );
    expect(screen.getByRole("button", { name: AUDIT_EVIDENCE_CONTROL_LINEAGE_RETRY_ACTION })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: AUDIT_EVIDENCE_CONTROL_LINEAGE_BACK_TO_LOOKUP_ACTION })).toBeInTheDocument();
  });

  it("hides raw route ids from the header and uses Button for chain toggle", () => {
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

    expect(screen.queryByText(/assessmentId=/)).not.toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-positive-checkbox")).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(screen.getByTestId("audit-evidence-positive-checkbox"));

    expect(screen.getByTestId("audit-evidence-positive-checkbox")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("audit-evidence-lineage-spine")).toBeInTheDocument();
  });
});
