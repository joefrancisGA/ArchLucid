import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { STORED_EVIDENCE_DIAGRAM_SHAPE_HIGHLIGHT_CLASS } from "@/lib/runs/stored-evidence-diagram-shape-highlight";

const mermaidRenderMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    svg:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><g class="node" id="flowchart-api-0"><title>api</title></g></svg>',
  }),
);
const mermaidInitializeMock = vi.hoisted(() => vi.fn());

vi.mock("mermaid", () => ({
  default: {
    initialize: mermaidInitializeMock,
    render: mermaidRenderMock,
  },
}));

vi.mock("@/lib/use-document-dark-mode", () => ({
  useDocumentDarkMode: () => false,
}));

import { RunStoredEvidenceDiagramPreviewBody } from "@/components/runs/RunStoredEvidenceDiagramPreviewBody";

describe("RunStoredEvidenceDiagramPreviewBody", () => {
  it("renders mermaid preview with shape highlight class when shape id matches", async () => {
    render(
      <RunStoredEvidenceDiagramPreviewBody
        fileName="topology.mmd"
        contentType="text/vnd.mermaid"
        textContent={"flowchart LR\n  api[API]"}
        highlightShapeId="api"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("run-stored-evidence-diagram-preview-svg")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(document.querySelector(`.${STORED_EVIDENCE_DIAGRAM_SHAPE_HIGHLIGHT_CLASS}`)).not.toBeNull();
    });

    expect(mermaidRenderMock).toHaveBeenCalled();
    expect(mermaidInitializeMock).toHaveBeenCalled();
  });

  it("shows honesty copy for vsdx shape highlight requests", () => {
    render(
      <RunStoredEvidenceDiagramPreviewBody
        fileName="network.vsdx"
        contentType="application/vnd.ms-visio.drawing.main+xml"
        textContent="binary"
        highlightShapeId="lane-1"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Open file; shape id lane-1.");
  });
});
