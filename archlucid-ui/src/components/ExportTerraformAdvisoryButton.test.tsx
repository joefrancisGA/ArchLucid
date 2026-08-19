import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExportTerraformAdvisoryButton } from "@/components/ExportTerraformAdvisoryButton";
import { TERRAFORM_ADVISORY_EXPORT_DISCLAIMER } from "@/lib/terraform-advisory-disclaimer";

const { downloadMock } = vi.hoisted(() => ({
  downloadMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();

  return {
    ...actual,
    downloadTerraformAdvisoryExportZip: downloadMock,
  };
});

vi.mock("@/lib/first-tenant-funnel-telemetry", () => ({
  recordFirstExportOpenedOnce: vi.fn(),
}));

describe("ExportTerraformAdvisoryButton", () => {
  it("shows disclaimer in alert dialog and downloads after confirm", async () => {
    const runId = "6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501";
    render(<ExportTerraformAdvisoryButton runId={runId} />);

    fireEvent.click(screen.getByTestId("export-terraform-advisory-button"));
    const dialog = await screen.findByRole("alertdialog");

    expect(within(dialog).getByText(TERRAFORM_ADVISORY_EXPORT_DISCLAIMER)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /download zip/i }));

    await waitFor(() => expect(downloadMock).toHaveBeenCalledWith(runId));
  });
});
