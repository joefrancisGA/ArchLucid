import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CopyManifestButton } from "@/components/CopyManifestButton";

vi.mock("@/lib/manifest-json-fetch", () => ({
  fetchManifestJsonText: vi.fn(),
}));

import { fetchManifestJsonText } from "@/lib/manifest-json-fetch";

describe("CopyManifestButton", () => {
  it("copies manifest JSON to the clipboard", async () => {
    vi.mocked(fetchManifestJsonText).mockResolvedValue('{"manifestId":"m-1"}');
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(<CopyManifestButton runId="run-abc-123" />);

    fireEvent.click(screen.getByTestId("copy-manifest-json-button"));

    await waitFor(() => {
      expect(fetchManifestJsonText).toHaveBeenCalledWith("run-abc-123");
    });

    expect(writeText).toHaveBeenCalledWith('{"manifestId":"m-1"}');
    expect(screen.getByTestId("copy-manifest-json-button")).toHaveTextContent("Copied!");

    vi.unstubAllGlobals();
  });

  it("surfaces fetch failures", async () => {
    vi.mocked(fetchManifestJsonText).mockRejectedValue(new Error("Review not found"));

    render(<CopyManifestButton runId="missing-run" />);

    fireEvent.click(screen.getByTestId("copy-manifest-json-button"));

    expect(await screen.findByTestId("copy-manifest-json-error")).toHaveTextContent("Review not found");
  });
});
