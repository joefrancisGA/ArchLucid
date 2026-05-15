import { describe, expect, it } from "vitest";

import type { ArtifactDescriptor } from "@/types/authority";

import { resolveExtractorNamedArtifact } from "./run-savings-summary-model";

function sampleDescriptor(partial: Partial<ArtifactDescriptor>): ArtifactDescriptor {
  return {
    artifactId: partial.artifactId ?? "00000000-0000-4000-8000-000000000001",
    artifactType: partial.artifactType ?? "JsonBundle",
    name: partial.name ?? "file.json",
    format: partial.format ?? "application/json",
    createdUtc: partial.createdUtc ?? "2026-01-01T00:00:00.000Z",
    contentHash: partial.contentHash ?? "h",
    manifestId: partial.manifestId,
    runId: partial.runId,
  };
}

describe("resolveExtractorNamedArtifact", () => {
  it("matches nested extractor paths", () => {
    const list: ArtifactDescriptor[] = [
      sampleDescriptor({ name: "package/cost-actual.json" }),
      sampleDescriptor({ name: "summary.md" }),
    ];

    const hit = resolveExtractorNamedArtifact(list, ["cost-actual.json"]);

    expect(hit?.name.endsWith("cost-actual.json")).toBe(true);
  });
});
