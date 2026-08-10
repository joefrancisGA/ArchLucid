import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DownloadManifestButton } from "@/components/DownloadManifestButton";

vi.mock("@/lib/manifest-json-fetch", () => ({
  fetchManifestJsonText: vi.fn(),
  manifestJsonDownloadFileName: vi.fn((runId: string) => `${runId}-manifest.json`),
}));

import { fetchManifestJsonText } from "@/lib/manifest-json-fetch";

describe("DownloadManifestButton", () => {
  it("downloads manifest JSON with a run-scoped file name", async () => {
    vi.mocked(fetchManifestJsonText).mockResolvedValue('{"manifestId":"m-1","decisions":[]}');

    const createObjectUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    const revokeObjectUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const originalCreateElement = document.createElement.bind(document);
    const anchor = originalCreateElement("a");
    const clickSpy = vi.spyOn(anchor, "click").mockImplementation(() => {});
    const createElement = vi.spyOn(document, "createElement").mockImplementation((tagName, options) => {
      if (tagName === "a") return anchor;
      return originalCreateElement(tagName, options);
    });

    render(<DownloadManifestButton runId="run-abc-123" />);

    fireEvent.click(screen.getByTestId("download-manifest-json-button"));

    await waitFor(() => {
      expect(fetchManifestJsonText).toHaveBeenCalledWith("run-abc-123");
    });

    expect(anchor.download).toBe("run-abc-123-manifest.json");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:mock");

    createElement.mockRestore();
    createObjectUrl.mockRestore();
    revokeObjectUrl.mockRestore();
  });

  it("surfaces API failures", async () => {
    vi.mocked(fetchManifestJsonText).mockRejectedValue(new Error("Review not found"));

    render(<DownloadManifestButton runId="missing-run" />);

    fireEvent.click(screen.getByTestId("download-manifest-json-button"));

    expect(await screen.findByTestId("download-manifest-json-error")).toHaveTextContent("Review not found");
  });
});
