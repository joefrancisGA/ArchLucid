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
