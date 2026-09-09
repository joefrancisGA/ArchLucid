import { describe, expect, it } from "vitest";

import { buildSealedManifestExportJson } from "@/lib/sealed-manifest-json-export";

describe("buildSealedManifestExportJson (FC-55)", () => {
  it("wraps manifest with transparency trail arrays when trail is complete", () => {
    const raw = JSON.stringify({
      manifestId: "m-1",
      feasibilityVerdict: {
        transparencyTrail: {
          asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
          inferred: [],
          skipped: [],
        },
      },
    });

    const result = buildSealedManifestExportJson({
      rawManifestJson: raw,
      runId: "run-1",
      workingDesk: true,
      careerArtifactHonesty: {
        progressSummary: null,
        manifestSummary: null,
        graphSnapshot: null,
        enginesSucceeded: 35,
        transparencyTrail: {
          asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
          inferred: [],
          skipped: [],
        },
      },
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    const parsed = JSON.parse(result.jsonText) as {
      _careerExportHonesty: { transparencyTrail: { asserted: unknown[] } };
    };

    expect(parsed._careerExportHonesty.transparencyTrail.asserted).toHaveLength(1);
  });

  it("blocks Working export when transparency trail is incomplete", () => {
    const raw = JSON.stringify({ manifestId: "m-1" });

    const result = buildSealedManifestExportJson({
      rawManifestJson: raw,
      runId: "run-1",
      workingDesk: true,
      careerArtifactHonesty: {
        progressSummary: null,
        manifestSummary: null,
        graphSnapshot: null,
        enginesSucceeded: 35,
        transparencyTrail: { asserted: [], inferred: undefined, skipped: [] } as never,
      },
    });

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.blockedReason).toMatch(/transparency trail/i);
  });
});
