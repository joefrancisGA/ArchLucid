import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { strToU8, zipSync } from "fflate";

import { useNewRunWizardPendingEvidence } from "@/app/(operator)/architecture/reviews/new/use-new-run-wizard-pending-evidence";

vi.mock("@/lib/wizard-pending-evidence-upload", () => ({
  uploadWizardPendingInventoryEvidence: vi.fn(),
  uploadWizardPendingDocumentEvidence: vi.fn(),
}));

import {
  uploadWizardPendingInventoryEvidence,
} from "@/lib/wizard-pending-evidence-upload";

function buildAwsInventoryZipFile(): File {
  const bytes = zipSync({
    "manifest.json": strToU8(
      JSON.stringify({
        schemaVersion: 1,
        scriptVersion: "0.1.0",
        collectionTimestamp: "2026-05-17T12:00:00.000Z",
        accountId: "123456789012",
        scope: "us-east-1",
      }),
    ),
    "resources.json": strToU8(JSON.stringify([])),
  });

  return new File([bytes], "archlucid-aws-package.zip", { type: "application/zip" });
}

describe("useNewRunWizardPendingEvidence (TB-2246)", () => {
  it("detects Aws inventory ZIPs and notifies the wizard with the Aws platform", async () => {
    const onInventoryFileSelected = vi.fn();

    const { result } = renderHook(() =>
      useNewRunWizardPendingEvidence({
        runId: null,
        autoUploadOnCreate: false,
        onInventoryFileSelected,
      }),
    );

    const file = buildAwsInventoryZipFile();

    act(() => {
      result.current.handlePendingEvidenceFileChange(file);
    });

    await waitFor(() => {
      expect(onInventoryFileSelected).toHaveBeenCalledWith("aws");
    });
  });

  it("uploads pending inventory with the detected platform", async () => {
    vi.mocked(uploadWizardPendingInventoryEvidence).mockResolvedValue({ ok: true });

    const onInventoryFileSelected = vi.fn();
    const file = buildAwsInventoryZipFile();

    const { result } = renderHook(() =>
      useNewRunWizardPendingEvidence({
        runId: "run-aws",
        autoUploadOnCreate: false,
        onInventoryFileSelected,
      }),
    );

    act(() => {
      result.current.handlePendingEvidenceFileChange(file);
    });

    await waitFor(() => {
      expect(onInventoryFileSelected).toHaveBeenCalledWith("aws");
    });

    await act(async () => {
      await result.current.uploadPendingEvidence("run-aws");
    });

    expect(uploadWizardPendingInventoryEvidence).toHaveBeenCalledWith(
      "run-aws",
      "aws",
      file,
      expect.objectContaining({ onUploadProgress: expect.any(Function) }),
    );
  });
});
