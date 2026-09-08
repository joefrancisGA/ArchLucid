import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { strToU8, zipSync } from "fflate";

import { useNewRunWizardPendingEvidence } from "@/app/(operator)/architecture/reviews/new/use-new-run-wizard-pending-evidence";

vi.mock("@/lib/wizard-pending-evidence-upload", () => ({
  uploadWizardPendingInventoryEvidence: vi.fn(),
  uploadWizardPendingDocumentEvidence: vi.fn(),
}));

vi.mock("@/lib/read-tier1-inventory-package-zip", () => ({
  detectTier1InventoryPlatformFromFile: vi.fn(),
}));

import {
  uploadWizardPendingDocumentEvidence,
  uploadWizardPendingInventoryEvidence,
} from "@/lib/wizard-pending-evidence-upload";
import { detectTier1InventoryPlatformFromFile } from "@/lib/read-tier1-inventory-package-zip";

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
    vi.mocked(detectTier1InventoryPlatformFromFile).mockResolvedValue("aws");
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
    vi.mocked(detectTier1InventoryPlatformFromFile).mockResolvedValue("aws");
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

  it("waits for inventory platform detection before auto-uploading pending evidence", async () => {
    let resolvePlatform!: (platform: "aws" | null) => void;
    const platformPromise = new Promise<"aws" | null>((resolve) => {
      resolvePlatform = resolve;
    });

    vi.mocked(detectTier1InventoryPlatformFromFile).mockReturnValue(platformPromise);
    vi.mocked(uploadWizardPendingInventoryEvidence).mockResolvedValue({ ok: true });
    vi.mocked(uploadWizardPendingDocumentEvidence).mockResolvedValue({ ok: true });

    const inventoryFile = buildAwsInventoryZipFile();
    const documentFile = new File(["notes"], "notes.pdf", { type: "application/pdf" });

    const { result } = renderHook(() =>
      useNewRunWizardPendingEvidence({
        runId: "run-mixed",
        autoUploadOnCreate: true,
        onInventoryFileSelected: vi.fn(),
      }),
    );

    act(() => {
      result.current.handlePendingEvidenceFileChange(inventoryFile);
      result.current.setPendingDocumentFiles([documentFile]);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(uploadWizardPendingDocumentEvidence).not.toHaveBeenCalled();
    expect(uploadWizardPendingInventoryEvidence).not.toHaveBeenCalled();

    await act(async () => {
      resolvePlatform("aws");
      await platformPromise;
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(uploadWizardPendingInventoryEvidence).toHaveBeenCalledWith(
        "run-mixed",
        "aws",
        inventoryFile,
        expect.objectContaining({ onUploadProgress: expect.any(Function) }),
      );
      expect(uploadWizardPendingDocumentEvidence).toHaveBeenCalledWith("run-mixed", [documentFile]);
    });
  });

  it("auto-uploads pending documents when inventory file is not a tier-1 package", async () => {
    vi.mocked(detectTier1InventoryPlatformFromFile).mockResolvedValue(null);
    vi.mocked(uploadWizardPendingDocumentEvidence).mockResolvedValue({ ok: true });

    const invalidInventoryFile = new File(["not-inventory"], "notes.txt", { type: "text/plain" });
    const documentFile = new File(["notes"], "notes.pdf", { type: "application/pdf" });

    const { result } = renderHook(() =>
      useNewRunWizardPendingEvidence({
        runId: "run-documents-only",
        autoUploadOnCreate: true,
        onInventoryFileSelected: vi.fn(),
      }),
    );

    act(() => {
      result.current.handlePendingEvidenceFileChange(invalidInventoryFile);
      result.current.setPendingDocumentFiles([documentFile]);
    });

    await waitFor(() => {
      expect(uploadWizardPendingDocumentEvidence).toHaveBeenCalledWith("run-documents-only", [documentFile]);
    });

    expect(uploadWizardPendingInventoryEvidence).not.toHaveBeenCalled();
    expect(result.current.evidenceUploadState).toBe("success");
  });
});
