import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useArchitectureDraftRequirementsImport } from "@/hooks/use-architecture-draft-requirements-import";
import { architectureDraftRequirementsImportEmptyMessage } from "@/lib/guided-intake-copy";

function requirementsFile(text: string): File {
  return Object.assign(new File([text], "network-requirements.txt"), {
    text: vi.fn().mockResolvedValue(text),
  });
}

describe("useArchitectureDraftRequirementsImport", () => {
  it("lets the same file be selected again after a temporary read failure", async () => {
    const file = requirementsFile("Use private endpoints.");
    vi.mocked(file.text).mockRejectedValueOnce(new Error("read failed"));
    const onOverviewChange = vi.fn();
    const { result } = renderHook(() => useArchitectureDraftRequirementsImport({
      currentOverview: "Existing overview",
      onOverviewChange,
    }));

    act(() => result.current.onRequirementsFilesSelected([file]));
    await waitFor(() => expect(result.current.importError).not.toBeNull());
    await act(async () => result.current.onRequirementsFilesSelected([file]));

    expect(file.text).toHaveBeenCalledTimes(2);
    expect(onOverviewChange).toHaveBeenCalledExactlyOnceWith(
      "Existing overview\n\n---\nFrom network-requirements.txt:\n\nUse private endpoints.",
    );
  });

  it("appends to an overview accepted while extraction is in progress", async () => {
    const extracted = Promise.withResolvers<string>();
    const file = Object.assign(new File(["requirements"], "network-requirements.txt"), {
      text: vi.fn(() => extracted.promise),
    });
    const onOverviewChange = vi.fn();
    const { result, rerender } = renderHook(({ currentOverview }) => useArchitectureDraftRequirementsImport({
      currentOverview,
      onOverviewChange,
    }), { initialProps: { currentOverview: "Old overview" } });

    act(() => result.current.onRequirementsFilesSelected([file]));
    rerender({ currentOverview: "Accepted rewrite" });
    await act(async () => extracted.resolve("Use private endpoints."));

    expect(onOverviewChange).toHaveBeenCalledExactlyOnceWith(
      "Accepted rewrite\n\n---\nFrom network-requirements.txt:\n\nUse private endpoints.",
    );
  });

  it("does not append filename tokens for an empty requirements file", async () => {
    const onOverviewChange = vi.fn();
    const { result } = renderHook(() => useArchitectureDraftRequirementsImport({
      currentOverview: "Existing overview",
      onOverviewChange,
    }));

    act(() => result.current.onRequirementsFilesSelected([requirementsFile("  ")]));

    await waitFor(() => {
      expect(result.current.importError).toBe(architectureDraftRequirementsImportEmptyMessage("network-requirements.txt"));
    });
    expect(onOverviewChange).not.toHaveBeenCalled();
  });

  it("appends extracted text without adding filename tokens as requirements", async () => {
    const onOverviewChange = vi.fn();
    const { result } = renderHook(() => useArchitectureDraftRequirementsImport({
      currentOverview: "Existing overview",
      onOverviewChange,
    }));

    act(() => result.current.onRequirementsFilesSelected([requirementsFile("Use private endpoints.")]));

    await waitFor(() => {
      expect(onOverviewChange).toHaveBeenCalledWith(
        "Existing overview\n\n---\nFrom network-requirements.txt:\n\nUse private endpoints.",
      );
    });
  });
});
