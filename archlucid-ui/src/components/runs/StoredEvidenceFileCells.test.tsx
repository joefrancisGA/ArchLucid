import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  StoredEvidenceFileCells,
  openRunStoredEvidencePreview,
  RunStoredEvidencePreviewDialog,
  useStoredEvidenceFileActions,
} from "@/components/runs/StoredEvidenceFileCells";

vi.mock("@/lib/runs/run-stored-evidence-file-api", () => ({
  downloadRunStoredEvidenceFile: vi.fn(),
  fetchRunStoredEvidenceFileBlob: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("shape=api"),
}));

const mermaidRenderMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    svg:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><g class="node" id="flowchart-api-0"><title>api</title></g></svg>',
  }),
);

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: mermaidRenderMock,
  },
}));

vi.mock("@/lib/use-document-dark-mode", () => ({
  useDocumentDarkMode: () => false,
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
      <RunStoredEvidencePreviewDialog runId={props.runId} preview={preview} onClose={closePreview} />
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

  it("closes the preview dialog on Escape and restores focus to the open trigger", async () => {
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
      expect(screen.getByTestId("run-stored-evidence-preview-dialog")).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(screen.queryByTestId("run-stored-evidence-preview-dialog")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(openButton);
    });
  });

  it("renders mermaid preview with shape highlight when shape query param is present", async () => {
    const blob = new Blob(["flowchart LR\n  api[API]"], { type: "text/vnd.mermaid" });
    vi.mocked(fetchRunStoredEvidenceFileBlob).mockResolvedValue({
      blob,
      fileName: "topology.mmd",
      contentType: "text/vnd.mermaid",
    });

    render(
      <PreviewHarness
        runId="run-1"
        evidenceItemId="ev-mermaid"
        fileName="topology.mmd"
        contentType="text/vnd.mermaid"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "topology.mmd" }));

    await waitFor(() => {
      expect(screen.getByTestId("run-stored-evidence-diagram-preview-svg")).toBeInTheDocument();
    });
  });

  it("routes SVG open attempts through download-only handling", async () => {
    vi.mocked(downloadRunStoredEvidenceFile).mockResolvedValue();

    const result = await openRunStoredEvidencePreview("run-1", "ev-2", "topology.svg", "image/svg+xml");

    expect(result).toBe("download-only");
    expect(fetchRunStoredEvidenceFileBlob).not.toHaveBeenCalled();
  });
});
