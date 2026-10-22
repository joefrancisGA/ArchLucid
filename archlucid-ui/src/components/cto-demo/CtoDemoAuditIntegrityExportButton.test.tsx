import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CtoDemoAuditIntegrityExportButton } from "@/components/cto-demo/CtoDemoAuditIntegrityExportButton";

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoPackEnv: vi.fn(() => true),
}));

vi.mock("@/lib/api", () => ({
  downloadAuditExportCsv: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

describe("CtoDemoAuditIntegrityExportButton", () => {
  it("renders and exports showcase audit CSV when clicked", async () => {
    const { downloadAuditExportCsv } = await import("@/lib/api");

    render(<CtoDemoAuditIntegrityExportButton />);

    expect(screen.getByTestId("cto-demo-audit-integrity-export")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Export audit trail (CSV)" }));

    await waitFor(() => {
      expect(downloadAuditExportCsv).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: "customer-intake-modernization",
        }),
      );
    });
  });

  it("does not render when demo pack env is inactive", async () => {
    const { isCtoDemoPackEnv } = await import("@/lib/cto-demo-presenter-pack");

    vi.mocked(isCtoDemoPackEnv).mockReturnValue(false);

    const { container } = render(<CtoDemoAuditIntegrityExportButton />);

    expect(container.firstChild).toBeNull();
  });
});
