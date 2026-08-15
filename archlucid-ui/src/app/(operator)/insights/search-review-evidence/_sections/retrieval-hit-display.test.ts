import { describe, expect, it } from "vitest";

import { reviewSignedRecordPath } from "@/lib/signed-records-paths";

import {
  buildRetrievalHitActionLink,
  buildRetrievalHitEvidenceTrailHref,
  resolveRetrievalHitRunId,
  retrievalHitRelevanceTier,
  retrievalHitSourceTypeLabel,
} from "./retrieval-hit-display";
import type { RetrievalHit } from "./retrieval-hit";

const SAMPLE_RUN_ID = "a1c2e3f4-a5b6-7890-abcd-ef1234567890";
const SAMPLE_MANIFEST_ID = "b2d3e4f5-a6b7-8901-bcde-f12345678901";

function hit(partial: Partial<RetrievalHit>): RetrievalHit {
  return {
    chunkId: "chunk-1",
    documentId: "",
    sourceType: "ManifestFinding",
    sourceId: "sensitive-data-minimization-risk",
    title: "PHI boundary",
    text: "Sample snippet",
    score: 0.82,
    ...partial,
  };
}

describe("retrievalHitSourceTypeLabel", () => {
  it("maps manifest finding to Finding", () => {
    expect(retrievalHitSourceTypeLabel("ManifestFinding")).toBe("Finding");
  });
});

describe("retrievalHitRelevanceTier", () => {
  it("classifies high scores", () => {
    expect(retrievalHitRelevanceTier(0.85)).toBe("high");
  });
});

describe("resolveRetrievalHitRunId", () => {
  it("parses run id from manifest finding document id", () => {
    const resolved = resolveRetrievalHitRunId(
      hit({
        documentId: `manifest-${SAMPLE_RUN_ID}-finding-sensitive-data-minimization-risk`,
      }),
    );

    expect(resolved).toBe(SAMPLE_RUN_ID);
  });

  it("falls back to scoped run filter", () => {
    expect(resolveRetrievalHitRunId(hit({ documentId: "" }), SAMPLE_RUN_ID)).toBe(SAMPLE_RUN_ID);
  });
});

describe("buildRetrievalHitActionLink", () => {
  it("links findings to inspect route", () => {
    const link = buildRetrievalHitActionLink(
      hit({
        findingId: "sensitive-data-minimization-risk",
        documentId: `manifest-${SAMPLE_RUN_ID}-finding-sensitive-data-minimization-risk`,
      }),
    );

    expect(link).toEqual({
      href: `/architecture/reviews/${SAMPLE_RUN_ID}/findings/sensitive-data-minimization-risk/evidence-trace`,
      label: "Open finding",
    });
  });

  it("links signed manifest hits to manifest detail", () => {
    const link = buildRetrievalHitActionLink(
      hit({
        sourceType: "Manifest",
        sourceId: SAMPLE_MANIFEST_ID,
        findingId: undefined,
      }),
    );

    expect(link).toEqual({
      href: `/governance/sealed-records/${SAMPLE_MANIFEST_ID}`,
      label: "Open sealed review record",
    });
  });

  it("links manifest decisions to the run-scoped sealed record path", () => {
    const link = buildRetrievalHitActionLink(
      hit({
        sourceType: "ManifestDecision",
        sourceId: SAMPLE_MANIFEST_ID,
        decisionId: "approve-phi-boundary",
        findingId: undefined,
      }),
      SAMPLE_RUN_ID,
    );

    expect(link).toEqual({
      href: reviewSignedRecordPath(SAMPLE_RUN_ID),
      label: "Open decision in review",
    });
  });

  it("links provenance graph hits to the evidence graph", () => {
    const link = buildRetrievalHitActionLink(
      hit({
        sourceType: "ProvenanceGraph",
        sourceId: SAMPLE_RUN_ID,
        documentId: `provenance-${SAMPLE_RUN_ID}`,
        findingId: undefined,
      }),
    );

    expect(link).toEqual({
      href: `/insights/evidence-graph?runId=${SAMPLE_RUN_ID}`,
      label: "Open evidence trail",
    });
  });
});

describe("buildRetrievalHitEvidenceTrailHref", () => {
  it("builds an evidence graph href from a resolved run id", () => {
    expect(
      buildRetrievalHitEvidenceTrailHref(
        hit({
          documentId: `manifest-${SAMPLE_RUN_ID}-finding-sensitive-data-minimization-risk`,
        }),
      ),
    ).toBe(`/insights/evidence-graph?runId=${SAMPLE_RUN_ID}`);
  });

  it("returns null when no run id can be resolved", () => {
    expect(buildRetrievalHitEvidenceTrailHref(hit({ documentId: "" }))).toBeNull();
  });
});
