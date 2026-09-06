import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  downloadAuditExportCsv: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { downloadAuditExportCsv } from "@/lib/api";
import { ApiRequestError } from "@/lib/api-request-error";

import { RunScopedAuditExportButton } from "@/components/runs/RunScopedAuditExportButton";

const mockUseOperatorNavAuthority = vi.mocked(useOperatorNavAuthority);
const mockDownloadAuditExportCsv = vi.mocked(downloadAuditExportCsv);

function mockPrincipal(roleClaimValues: string[], primaryAppRole: "Admin" | "Operator" | "Reader" | "Auditor"): void {
  mockUseOperatorNavAuthority.mockReturnValue({
    currentPrincipal: {
      roleClaimValues,
      primaryAppRole,
    },
  } as ReturnType<typeof useOperatorNavAuthority>);
}

describe("RunScopedAuditExportButton", () => {
  it("exports run-scoped audit CSV for Auditor principals", async () => {
    mockPrincipal(["Auditor"], "Auditor");

    render(<RunScopedAuditExportButton runId="run-123" manifestVersion="manifest-123" />);

    fireEvent.click(screen.getByTestId("run-scoped-audit-export-button"));

    await waitFor(() => {
      expect(mockDownloadAuditExportCsv).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: "run-123",
          maxRows: 10_000,
        }),
      );
    });
  });

  it("hides the control for Reader principals without Auditor claims", () => {
    mockPrincipal(["Reader"], "Reader");

    const { container } = render(<RunScopedAuditExportButton runId="run-123" />);

    expect(container.firstChild).toBeNull();
  });

  it("shows role hint when Operator lacks Auditor claims", () => {
    mockPrincipal(["Operator"], "Operator");

    render(<RunScopedAuditExportButton runId="run-123" />);

    expect(screen.getByTestId("run-scoped-audit-export-role-hint")).toBeInTheDocument();
    expect(screen.getByTestId("run-scoped-audit-export-button")).toBeDisabled();
  });

  it("surfaces role hint after API 403", async () => {
    mockPrincipal(["Admin"], "Admin");
    mockDownloadAuditExportCsv.mockRejectedValueOnce(
      new ApiRequestError("Forbidden", { httpStatus: 403, correlationId: null, problem: null }),
    );

    render(<RunScopedAuditExportButton runId="run-403" manifestVersion="manifest-403" />);

    fireEvent.click(screen.getByTestId("run-scoped-audit-export-button"));

    await waitFor(() => {
      expect(screen.getByTestId("run-scoped-audit-export-role-hint")).toBeInTheDocument();
    });
  });

  it("shows sealed-manifest blocked reason when manifest version is missing", () => {
    mockPrincipal(["Auditor"], "Auditor");

    render(<RunScopedAuditExportButton runId="run-123" />);

    expect(screen.getByTestId("run-scoped-audit-export-button")).toBeDisabled();
    expect(screen.getByTestId("run-scoped-audit-export-blocked-reason")).toBeInTheDocument();
  });
});
