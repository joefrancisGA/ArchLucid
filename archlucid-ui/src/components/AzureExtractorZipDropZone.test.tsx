import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AzureExtractorZipDropZone } from "@/components/AzureExtractorZipDropZone";
import { AZURE_EXTRACTOR_ZIP_ONLY_MESSAGE } from "@/lib/is-azure-extractor-zip-file";

describe("AzureExtractorZipDropZone", () => {
  it("rejects non-zip file selection", async () => {
    const onZipSelected = vi.fn();
    const onInvalidFile = vi.fn();

    render(
      <AzureExtractorZipDropZone
        ariaLabel="Upload ZIP"
        testId="drop-zone"
        onZipSelected={onZipSelected}
        onInvalidFile={onInvalidFile}
      />,
    );

    const input = screen.getByTestId("drop-zone-input");
    const textFile = new File(["hello"], "readme.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [textFile] } });

    await waitFor(() => {
      expect(onInvalidFile).toHaveBeenCalledWith(AZURE_EXTRACTOR_ZIP_ONLY_MESSAGE);
    });
    expect(onZipSelected).not.toHaveBeenCalled();
  });

  it("accepts zip file selection", async () => {
    const onZipSelected = vi.fn();

    render(
      <AzureExtractorZipDropZone
        ariaLabel="Upload ZIP"
        testId="drop-zone"
        onZipSelected={onZipSelected}
      />,
    );

    const input = screen.getByTestId("drop-zone-input");
    const zipFile = new File(["zip"], "package.zip", { type: "application/zip" });

    fireEvent.change(input, { target: { files: [zipFile] } });

    await waitFor(() => {
      expect(onZipSelected).toHaveBeenCalledWith(zipFile);
    });
  });

  it("shows progress while busy", () => {
    render(
      <AzureExtractorZipDropZone
        ariaLabel="Upload ZIP"
        busy
        busyLabel="Uploading…"
        testId="drop-zone"
        onZipSelected={vi.fn()}
      />,
    );

    expect(screen.getByTestId("drop-zone-progress")).toBeInTheDocument();
  });
});
