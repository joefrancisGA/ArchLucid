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

  it("auto-uploads after platform detection when a quick-start run id already exists", async () => {
    vi.mocked(detectTier1InventoryPlatformFromFile).mockResolvedValue("aws");
    vi.mocked(uploadWizardPendingInventoryEvidence).mockResolvedValue({ ok: true });

    const file = buildAwsInventoryZipFile();

    const { result, rerender } = renderHook(
      ({ runId }) =>
        useNewRunWizardPendingEvidence({
          runId,
          autoUploadOnCreate: true,
          onInventoryFileSelected: vi.fn(),
        }),
      { initialProps: { runId: "run-quick-existing" as string | null } },
    );

    act(() => {
      result.current.handlePendingEvidenceFileChange(file);
    });

    await waitFor(() => {
      expect(uploadWizardPendingInventoryEvidence).toHaveBeenCalledWith(
        "run-quick-existing",
        "aws",
        file,
        expect.objectContaining({ onUploadProgress: expect.any(Function) }),
      );
    });

    rerender({ runId: "run-quick-existing" });
  });

  it("records automatic inventory upload exceptions as failed evidence uploads", async () => {
    vi.mocked(detectTier1InventoryPlatformFromFile).mockResolvedValue("aws");
    vi.mocked(uploadWizardPendingInventoryEvidence).mockRejectedValue(new Error("network unavailable"));

    const file = buildAwsInventoryZipFile();
    const { result } = renderHook(() =>
      useNewRunWizardPendingEvidence({
        runId: "run-quick-existing",
        autoUploadOnCreate: true,
        onInventoryFileSelected: vi.fn(),
      }),
    );

    act(() => {
      result.current.handlePendingEvidenceFileChange(file);
    });

    await waitFor(() => {
      expect(result.current.evidenceUploadState).toBe("failed");
    });

    expect(result.current.evidenceUploadProgressPercent).toBeNull();
    expect(result.current.evidenceUploadError).toEqual({
      message: "network unavailable",
      problem: null,
      correlationId: null,
    });
  });

  it("retains a replacement inventory file when an in-flight upload for the prior file completes", async () => {
    let resolveUpload!: (value: { ok: true }) => void;
    const uploadPromise = new Promise<{ ok: true }>((resolve) => {
      resolveUpload = resolve;
    });

    vi.mocked(detectTier1InventoryPlatformFromFile).mockResolvedValue("aws");
    vi.mocked(uploadWizardPendingInventoryEvidence).mockReturnValue(uploadPromise);

    const firstFile = buildAwsInventoryZipFile();
    const replacementFile = new File([firstFile], "replacement-package.zip", { type: firstFile.type });

    const onInventoryFileSelected = vi.fn();

    const { result } = renderHook(() =>
      useNewRunWizardPendingEvidence({
        runId: "run-replace-during-upload",
        autoUploadOnCreate: false,
        onInventoryFileSelected,
      }),
    );

    act(() => {
      result.current.handlePendingEvidenceFileChange(firstFile);
    });

    await waitFor(() => {
      expect(onInventoryFileSelected).toHaveBeenCalledWith("aws");
    });

    act(() => {
      void result.current.uploadPendingEvidence("run-replace-during-upload");
    });

    await waitFor(() => {
      expect(result.current.evidenceUploadState).toBe("uploading");
    });

    act(() => {
      result.current.handlePendingEvidenceFileChange(replacementFile);
    });

    await act(async () => {
      resolveUpload({ ok: true });
      await uploadPromise;
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.pendingEvidenceFile).toBe(replacementFile);
      expect(result.current.evidenceUploadState).toBe("idle");
    });
  });

  it("ignores stale inventory platform detection when the pending ZIP is replaced before classification finishes", async () => {
    let resolveFirst!: (platform: "aws" | "azure" | "gcp" | null) => void;
    const firstDetection = new Promise<"aws" | "azure" | "gcp" | null>((resolve) => {
      resolveFirst = resolve;
    });
    let resolveSecond!: (platform: "aws" | "azure" | "gcp" | null) => void;
    const secondDetection = new Promise<"aws" | "azure" | "gcp" | null>((resolve) => {
      resolveSecond = resolve;
    });

    vi.mocked(detectTier1InventoryPlatformFromFile)
      .mockReturnValueOnce(firstDetection)
      .mockReturnValueOnce(secondDetection);

    const onInventoryFileSelected = vi.fn();
    const firstFile = buildAwsInventoryZipFile();
    const secondFile = new File([firstFile], "replacement-package.zip", { type: firstFile.type });

    const { result } = renderHook(() =>
      useNewRunWizardPendingEvidence({
        runId: null,
        autoUploadOnCreate: false,
        onInventoryFileSelected,
      }),
    );

    act(() => {
      result.current.handlePendingEvidenceFileChange(firstFile);
      result.current.handlePendingEvidenceFileChange(secondFile);
    });

    await act(async () => {
      resolveFirst("aws");
      await firstDetection;
      await Promise.resolve();
    });

    expect(onInventoryFileSelected).not.toHaveBeenCalled();

    await act(async () => {
      resolveSecond("azure");
      await secondDetection;
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(onInventoryFileSelected).toHaveBeenCalledTimes(1);
      expect(onInventoryFileSelected).toHaveBeenCalledWith("azure");
    });
  });

  it("does not upload documents cleared while inventory upload is in flight", async () => {
    let resolveInventory!: (value: { ok: true }) => void;
    const inventoryPromise = new Promise<{ ok: true }>((resolve) => {
      resolveInventory = resolve;
    });

    vi.mocked(detectTier1InventoryPlatformFromFile).mockResolvedValue("aws");
    vi.mocked(uploadWizardPendingInventoryEvidence).mockReturnValue(inventoryPromise);
    vi.mocked(uploadWizardPendingDocumentEvidence).mockResolvedValue({ ok: true });

    const inventoryFile = buildAwsInventoryZipFile();
    const documentFile = new File(["notes"], "notes.pdf", { type: "application/pdf" });

    const onInventoryFileSelected = vi.fn();

    const { result } = renderHook(() =>
      useNewRunWizardPendingEvidence({
        runId: "run-clear-docs-mid-upload",
        autoUploadOnCreate: false,
        onInventoryFileSelected,
      }),
    );

    act(() => {
      result.current.handlePendingEvidenceFileChange(inventoryFile);
      result.current.setPendingDocumentFiles([documentFile]);
    });

    await waitFor(() => {
      expect(onInventoryFileSelected).toHaveBeenCalledWith("aws");
      expect(result.current.pendingEvidenceFile).toBe(inventoryFile);
    });

    act(() => {
      void result.current.uploadPendingEvidence("run-clear-docs-mid-upload");
    });

    await waitFor(() => {
      expect(result.current.evidenceUploadState).toBe("uploading");
    });

    act(() => {
      result.current.setPendingDocumentFiles([]);
    });

    await act(async () => {
      resolveInventory({ ok: true });
      await inventoryPromise;
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(uploadWizardPendingInventoryEvidence).toHaveBeenCalledTimes(1);
      expect(uploadWizardPendingDocumentEvidence).not.toHaveBeenCalled();
      expect(result.current.evidenceUploadState).toBe("idle");
      expect(result.current.pendingEvidenceFile).toBe(inventoryFile);
      expect(result.current.pendingDocumentFiles).toEqual([]);
    });
  });

  it("retains pending inventory selection in hook state for post-submit upload retries", async () => {
    vi.mocked(detectTier1InventoryPlatformFromFile).mockResolvedValue("aws");

    const file = buildAwsInventoryZipFile();

    const { result } = renderHook(() =>
      useNewRunWizardPendingEvidence({
        runId: null,
        autoUploadOnCreate: false,
        onInventoryFileSelected: vi.fn(),
      }),
    );

    act(() => {
      result.current.handlePendingEvidenceFileChange(file);
    });

    await waitFor(() => {
      expect(result.current.pendingEvidenceFile).toBe(file);
    });
  });
});
