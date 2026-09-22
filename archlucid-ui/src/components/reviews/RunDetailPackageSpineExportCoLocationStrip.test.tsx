import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunScopedAuditExportButton } from "@/components/runs/RunScopedAuditExportButton";
import { RunDetailPackageSpineExportCoLocationStrip } from "@/components/reviews/RunDetailPackageSpineExportCoLocationStrip";

vi.mock("@/components/usability/ExportDeliverableDialog", () => ({
  ExportDeliverableDialog: () => <div data-testid="export-deliverable-dialog-mock" />,
}));

vi.mock("@/components/runs/RunScopedAuditExportButton", () => ({
  RunScopedAuditExportButton: ({ runId }: { runId: string }) => (
    <div data-testid="run-scoped-audit-export-spine-mock">{runId}</div>
  ),
}));

describe("RunDetailPackageSpineExportCoLocationStrip", () => {
  it("renders sponsor export affordances when manifest id is present", () => {
    render(
      <RunDetailPackageSpineExportCoLocationStrip
        runId="run-123"
        manifestId="manifest-456"
      />,
    );

    expect(screen.getByTestId("run-detail-package-spine-export-co-location")).toBeInTheDocument();
    expect(screen.getByTestId("export-deliverable-dialog-mock")).toBeInTheDocument();
    expect(screen.getByTestId("run-scoped-audit-export-spine-mock")).toHaveTextContent("run-123");
    expect(screen.getByTestId("run-detail-package-spine-all-deliverables-link")).toHaveAttribute(
      "href",
      "#artifacts-exports",
    );
  });

  it("renders nothing when manifest id is blank", () => {
    const { container } = render(
      <RunDetailPackageSpineExportCoLocationStrip runId="run-123" manifestId="   " />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
