import { describe, expect, it } from "vitest";

import { PIXEL_DIAGRAM_NOT_VERIFIABLE_WARNING_PREFIX } from "@/lib/architecture-spine/pixel-diagram-not-verifiable-warnings";
import { PIXEL_DIAGRAM_FILE_NAME_NOT_STORED } from "@/lib/architecture-spine/read-pixel-diagram-not-verifiable-sources";
import {
  formatArchitectureDeskDiagramSourceRow,
  readArchitectureDeskDiagramSourcesFromContextSnapshot,
  STRUCTURED_DIAGRAM_CANONICAL_SOURCE_TYPE,
  STRUCTURED_DIAGRAM_SOURCE_ID_NOT_STORED,
  STRUCTURED_DIAGRAM_SOURCE_ID_STORED_EMPTY,
} from "@/lib/architecture-spine/read-architecture-desk-diagram-sources";

describe("readArchitectureDeskDiagramSourcesFromContextSnapshot (AS-044)", () => {
  it("groups structured-diagram canonical objects by sourceId as analyzed rows", () => {
    const rows = readArchitectureDeskDiagramSourcesFromContextSnapshot({
      canonicalObjects: [
        {
          sourceType: STRUCTURED_DIAGRAM_CANONICAL_SOURCE_TYPE,
          sourceId: "topology.mmd",
          objectId: "obj-1",
        },
        {
          sourceType: STRUCTURED_DIAGRAM_CANONICAL_SOURCE_TYPE,
          sourceId: "topology.mmd",
          objectId: "obj-2",
        },
        {
          sourceType: "Document",
          sourceId: "notes.txt",
          objectId: "obj-3",
        },
      ],
    });

    expect(rows).toEqual([
      {
        sourceKey: "structured:topology.mmd",
        label: "topology.mmd",
        status: "analyzed",
        nodeCount: 2,
      },
    ]);
  });

  it("maps pixel diagram warnings to not-extracted rows", () => {
    const rows = readArchitectureDeskDiagramSourcesFromContextSnapshot({
      warnings: [
        `${PIXEL_DIAGRAM_NOT_VERIFIABLE_WARNING_PREFIX}file=legacy.png;mime=image/png;evidenceItemId=none;pending=none`,
      ],
    });

    expect(rows).toEqual([
      {
        sourceKey: "pixel:legacy.png",
        label: "legacy.png",
        status: "not-extracted",
        nodeCount: null,
      },
    ]);
  });

  it("returns both analyzed and not-extracted rows from one snapshot", () => {
    const rows = readArchitectureDeskDiagramSourcesFromContextSnapshot({
      canonicalObjects: [
        {
          sourceType: STRUCTURED_DIAGRAM_CANONICAL_SOURCE_TYPE,
          sourceId: "api-flow.drawio",
          objectId: "obj-1",
        },
      ],
      warnings: [
        `${PIXEL_DIAGRAM_NOT_VERIFIABLE_WARNING_PREFIX}file=scan.jpg;mime=image/jpeg;evidenceItemId=none;pending=none`,
      ],
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.status).toBe("analyzed");
    expect(rows[1]?.status).toBe("not-extracted");
  });

  it("maps missing file warnings to a single not-extracted row", () => {
    const rows = readArchitectureDeskDiagramSourcesFromContextSnapshot({
      warnings: [
        `${PIXEL_DIAGRAM_NOT_VERIFIABLE_WARNING_PREFIX}mime=image/png;evidenceItemId=none;pending=none`,
        `${PIXEL_DIAGRAM_NOT_VERIFIABLE_WARNING_PREFIX}mime=image/jpeg;evidenceItemId=none;pending=none`,
      ],
    });

    expect(rows).toEqual([
      {
        sourceKey: "pixel:file-name-not-stored",
        label: PIXEL_DIAGRAM_FILE_NAME_NOT_STORED,
        status: "not-extracted",
        nodeCount: null,
      },
    ]);
  });

  it("keeps missing-name and stored-name rows distinct when the file token matches the display sentence", () => {
    const rows = readArchitectureDeskDiagramSourcesFromContextSnapshot({
      warnings: [
        `${PIXEL_DIAGRAM_NOT_VERIFIABLE_WARNING_PREFIX}mime=image/png;evidenceItemId=none;pending=none`,
        `${PIXEL_DIAGRAM_NOT_VERIFIABLE_WARNING_PREFIX}file=${PIXEL_DIAGRAM_FILE_NAME_NOT_STORED};mime=image/png;evidenceItemId=none;pending=none`,
      ],
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.sourceKey).toBe("pixel:file-name-not-stored");
    expect(rows[1]?.sourceKey).toBe(`pixel:${PIXEL_DIAGRAM_FILE_NAME_NOT_STORED}`);
  });

  it("formats operator-facing row labels without claiming screenshot analysis", () => {
    const analyzed = formatArchitectureDeskDiagramSourceRow({
      sourceKey: "structured:topology.mmd",
      label: "topology.mmd",
      status: "analyzed",
      nodeCount: 3,
    });
    const notExtracted = formatArchitectureDeskDiagramSourceRow({
      sourceKey: "pixel:legacy.png",
      label: "legacy.png",
      status: "not-extracted",
      nodeCount: null,
    });

    expect(analyzed.toLowerCase()).toContain("topology analyzed");
    expect(analyzed).toContain("(3 nodes)");
    expect(notExtracted.toLowerCase()).toContain("not extracted");
    expect(notExtracted.toLowerCase()).not.toContain("analyzed your screenshot");
  });

  it("labels missing and stored-empty structured diagram source ids (P-16, P-17)", () => {
    const rows = readArchitectureDeskDiagramSourcesFromContextSnapshot({
      canonicalObjects: [
        { sourceType: STRUCTURED_DIAGRAM_CANONICAL_SOURCE_TYPE, sourceId: "", objectId: "obj-1" },
        { sourceType: STRUCTURED_DIAGRAM_CANONICAL_SOURCE_TYPE, sourceId: "   ", objectId: "obj-2" },
      ],
    });

    expect(rows).toEqual([
      {
        sourceKey: `structured:${STRUCTURED_DIAGRAM_SOURCE_ID_NOT_STORED}`,
        label: STRUCTURED_DIAGRAM_SOURCE_ID_NOT_STORED,
        status: "analyzed",
        nodeCount: 1,
      },
      {
        sourceKey: `structured:${STRUCTURED_DIAGRAM_SOURCE_ID_STORED_EMPTY}`,
        label: STRUCTURED_DIAGRAM_SOURCE_ID_STORED_EMPTY,
        status: "analyzed",
        nodeCount: 1,
      },
    ]);
  });
});
