import { beforeEach, describe, expect, it } from "vitest";

import {
  deriveCapturedEvidenceFromArtifacts,
  deriveCapturedEvidenceFromCatalog,
  mergeCapturedEvidenceUploadOutcomes,
  readPersistedCapturedEvidenceInventory,
  reconcileCapturedEvidenceInventory,
  writePersistedCapturedEvidenceInventory,
} from "@/lib/runs/run-detail-create-home-captured-evidence";

describe("run-detail-create-home-captured-evidence", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("derives captured rows from run artifacts", () => {
    const items = deriveCapturedEvidenceFromArtifacts([
      { artifactId: "art-2", name: "inventory.zip", createdUtc: "2026-08-12T10:00:00Z" },
      { artifactId: "art-1", name: "architecture-brief.md", createdUtc: "2026-08-12T09:00:00Z" },
    ]);

    expect(items).toHaveLength(2);
    expect(items[0]?.fileName).toBe("architecture-brief.md");
    expect(items[1]?.fileName).toBe("inventory.zip");
  });

  it("merges successful upload outcomes into captured inventory", () => {
    const merged = mergeCapturedEvidenceUploadOutcomes(
      deriveCapturedEvidenceFromArtifacts([
        { artifactId: "art-1", name: "brief.md", createdUtc: "2026-08-12T09:00:00Z" },
      ]),
      [
        { fileName: "diagram.png", status: "uploaded" },
        { fileName: "empty.txt", status: "failed", reason: "Empty file" },
      ],
      "2026-08-12T11:00:00Z",
    );

    expect(merged.map((item) => item.fileName)).toEqual(["brief.md", "diagram.png"]);
  });

  it("derives catalog rows with createdUtc and evidence ids", () => {
    const items = deriveCapturedEvidenceFromCatalog([
      {
        evidenceItemId: "ev-1",
        originalFileName: "diagram.png",
        createdUtc: "2026-08-12T11:00:00Z",
        contentType: "image/png",
      },
    ]);

    expect(items).toEqual([
      {
        key: "ev-1",
        fileName: "diagram.png",
        ingestedUtc: "2026-08-12T11:00:00Z",
        evidenceItemId: "ev-1",
        contentType: "image/png",
      },
    ]);
  });

  it("ignores session-only rows when catalog is authoritative", () => {
    const reconciled = reconcileCapturedEvidenceInventory(
      [
        {
          key: "ev-1",
          fileName: "diagram.png",
          ingestedUtc: "2026-08-12T11:00:00Z",
          evidenceItemId: "ev-1",
        },
      ],
      [
        {
          key: "session-only",
          fileName: "stale-brief.md",
          ingestedUtc: "2026-08-12T09:00:00Z",
        },
      ],
      { catalogAuthoritative: true },
    );

    expect(reconciled.map((item) => item.fileName)).toEqual(["diagram.png"]);
  });

  it("persists captured inventory in session storage for the run", () => {
    const items = [
      {
        key: "upload:diagram.png",
        fileName: "diagram.png",
        ingestedUtc: "2026-08-12T11:00:00Z",
      },
    ];

    writePersistedCapturedEvidenceInventory("run-1", items);

    expect(readPersistedCapturedEvidenceInventory("run-1")).toEqual(items);
    expect(readPersistedCapturedEvidenceInventory("run-2")).toEqual([]);
  });
});
