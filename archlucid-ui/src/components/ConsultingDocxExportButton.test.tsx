import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CONSULTING_DOCX_EXPORT_PERMISSION } from "@/lib/current-principal";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

const downloadMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  downloadConsultingArchitectureReportDocx: (runId: string) => downloadMock(runId),
}));

vi.mock("@/lib/first-tenant-funnel-telemetry", () => ({
  recordFirstExportOpenedOnce: vi.fn(),
}));

const nav = vi.hoisted(() => ({
  permissionClaimValues: [] as string[],
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      provenance: "auth-me" as const,
      name: "Op",
      roleClaimValues: ["Operator"],
      primaryAppRole: "Operator" as const,
      maxAuthority: "ExecuteAuthority" as const,
      authorityRank: 2,
      hasEnterpriseOperatorSurfaces: true,
      hasCommittedArchitectureReview: true,
      permissionClaimValues: nav.permissionClaimValues,
    },
    callerAuthorityRank: 2,
    isAuthorityLoading: false,
  }),
}));

import { ConsultingDocxExportButton } from "./ConsultingDocxExportButton";

describe("ConsultingDocxExportButton", () => {
  it("renders nothing without export permission", () => {
    nav.permissionClaimValues = [];
    const { container } = render(<ConsultingDocxExportButton runId="r1" />);
    expect(container.firstChild).toBeNull();
  });

  it("downloads when permission is present", () => {
    nav.permissionClaimValues = [CONSULTING_DOCX_EXPORT_PERMISSION];
    downloadMock.mockResolvedValue(undefined);
    render(<ConsultingDocxExportButton runId="run-abc" />);
    fireEvent.click(screen.getByTestId("consulting-docx-export-button"));
    expect(downloadMock).toHaveBeenCalledWith("run-abc");
  });
});
