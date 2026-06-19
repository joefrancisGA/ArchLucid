import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DownloadManifestButton } from "@/components/DownloadManifestButton";

vi.mock("@/lib/api/architecture-runs", () => ({
  getAuthorityRunManifest: vi.fn(),
}));

import { getAuthorityRunManifest } from "@/lib/api/architecture-runs";

describe("DownloadManifestButton", () => {
  it("downloads manifest JSON with a run-scoped file name", async () => {
    vi.mocked(getAuthorityRunManifest).mockResolvedValue({ manifestId: "m-1", decisions: [] });

    const createObjectUrl = vi.fn(() => "blob:mock");
    const revokeObjectUrl = vi.fn();
    const click = vi.fn();

    vi.stubGlobal("URL", { createObjectURL: createObjectUrl, revokeObjectURL: revokeObjectUrl });

    const anchor = { href: "", download: "", click } as unknown as HTMLAnchorElement;
    const createElement = vi.spyOn(document, "createElement").mockReturnValue(anchor);

    render(<DownloadManifestButton runId="run-abc-123" />);

    fireEvent.click(screen.getByTestId("download-manifest-json-button"));

    await waitFor(() => {
      expect(getAuthorityRunManifest).toHaveBeenCalledWith("run-abc-123");
    });

    expect(anchor.download).toBe("run-abc-123-manifest.json");
    expect(click).toHaveBeenCalledTimes(1);
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:mock");

    createElement.mockRestore();
    vi.unstubAllGlobals();
  });

  it("surfaces API failures", async () => {
    vi.mocked(getAuthorityRunManifest).mockRejectedValue(new Error("Manifest not found"));

    render(<DownloadManifestButton runId="missing-run" />);

    fireEvent.click(screen.getByTestId("download-manifest-json-button"));

    expect(await screen.findByTestId("download-manifest-json-error")).toHaveTextContent("Manifest not found");
  });
});
