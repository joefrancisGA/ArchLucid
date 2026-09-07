import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  StoredEvidenceFileCells,
  openRunStoredEvidencePreview,
  useStoredEvidenceFileActions,
} from "@/components/runs/StoredEvidenceFileCells";

vi.mock("@/lib/runs/run-stored-evidence-file-api", () => ({
  downloadRunStoredEvidenceFile: vi.fn(),
  fetchRunStoredEvidenceFileBlob: vi.fn(),
}));

import { downloadRunStoredEvidenceFile, fetchRunStoredEvidenceFileBlob } from "@/lib/runs/run-stored-evidence-file-api";

function PreviewHarness(props: { readonly runId: string; readonly evidenceItemId: string; readonly fileName: string; readonly contentType: string }) {
  const { preview, closePreview, handlers, openButtonRef } = useStoredEvidenceFileActions(props.runId);

  return (
    <>
      <StoredEvidenceFileCells
        runId={props.runId}
        evidenceItemId={props.evidenceItemId}
        fileName={props.fileName}
        contentType={props.contentType}
        handlers={handlers}
        openButtonRef={openButtonRef}
      />
      {preview !== null ? (
        <button type="button" data-testid="close-preview" onClick={closePreview}>
          Close preview
        </button>
      ) : null}
    </>
  );
}

describe("StoredEvidenceFileCells", () => {
  beforeEach(() => {
    vi.mocked(fetchRunStoredEvidenceFileBlob).mockReset();
    vi.mocked(downloadRunStoredEvidenceFile).mockReset();
  });

  it("renders an open link for previewable PNG files", () => {
    render(
      <StoredEvidenceFileCells
        runId="run-1"
        evidenceItemId="ev-1"
        fileName="diagram.png"
        contentType="image/png"
        handlers={{
          onOpen: vi.fn(),
          onDownload: vi.fn(),
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "diagram.png" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download diagram.png" })).toBeInTheDocument();
  });

  it("renders download-only label for SVG without an open link", () => {
    render(
      <StoredEvidenceFileCells
        runId="run-1"
        evidenceItemId="ev-2"
        fileName="topology.svg"
        contentType="image/svg+xml"
        handlers={{
          onOpen: vi.fn(),
          onDownload: vi.fn(),
        }}
      />,
    );

    expect(screen.queryByRole("button", { name: "topology.svg" })).not.toBeInTheDocument();
    expect(screen.getByText("topology.svg")).toBeInTheDocument();
  });

  it("opens the preview dialog for inline PNG content", async () => {
    const blob = new Blob(["png"], { type: "image/png" });
    vi.mocked(fetchRunStoredEvidenceFileBlob).mockResolvedValue({
      blob,
      fileName: "diagram.png",
      contentType: "image/png",
    });

    render(
      <PreviewHarness
        runId="run-1"
        evidenceItemId="ev-1"
        fileName="diagram.png"
        contentType="image/png"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "diagram.png" }));

    await waitFor(() => {
      expect(screen.getByTestId("close-preview")).toBeInTheDocument();
    });
  });

  it("restores focus to the open trigger after closing preview", async () => {
    const blob = new Blob(["png"], { type: "image/png" });
    vi.mocked(fetchRunStoredEvidenceFileBlob).mockResolvedValue({
      blob,
      fileName: "diagram.png",
      contentType: "image/png",
    });

    render(
      <PreviewHarness
        runId="run-1"
        evidenceItemId="ev-1"
        fileName="diagram.png"
        contentType="image/png"
      />,
    );

    const openButton = screen.getByRole("button", { name: "diagram.png" });
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByTestId("close-preview")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("close-preview"));

    await waitFor(() => {
      expect(document.activeElement).toBe(openButton);
    });
  });

  it("routes SVG open attempts through download-only handling", async () => {
    vi.mocked(downloadRunStoredEvidenceFile).mockResolvedValue();

    const result = await openRunStoredEvidencePreview("run-1", "ev-2", "topology.svg", "image/svg+xml");

    expect(result).toBe("download-only");
    expect(fetchRunStoredEvidenceFileBlob).not.toHaveBeenCalled();
  });
});
