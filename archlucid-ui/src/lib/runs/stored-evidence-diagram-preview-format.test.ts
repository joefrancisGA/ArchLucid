import { describe, expect, it } from "vitest";

import {
  resolveStoredEvidenceDiagramPreviewFormat,
  storedEvidenceDiagramShapeHighlightHonestyMessage,
} from "@/lib/runs/stored-evidence-diagram-preview-format";

describe("stored-evidence-diagram-preview-format", () => {
  it("detects mermaid stored evidence", () => {
    expect(
      resolveStoredEvidenceDiagramPreviewFormat("text/vnd.mermaid", "topology.mmd", "flowchart LR\n  api[API]"),
    ).toBe("mermaid");
  });

  it("detects vsdx format", () => {
    expect(
      resolveStoredEvidenceDiagramPreviewFormat(
        "application/vnd.ms-visio.drawing.main+xml",
        "network.vsdx",
        null,
      ),
    ).toBe("vsdx");
  });

  it("returns honesty message for vsdx shape highlight requests", () => {
    expect(storedEvidenceDiagramShapeHighlightHonestyMessage("lane-1", "vsdx")).toBe("Open file; shape id lane-1.");
    expect(storedEvidenceDiagramShapeHighlightHonestyMessage("api", "mermaid")).toBeNull();
  });
});
