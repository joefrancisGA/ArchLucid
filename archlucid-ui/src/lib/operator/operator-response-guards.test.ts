import { describe, expect, it } from "vitest";

import {
  coerceArtifactDescriptor,
  coerceArtifactDescriptorList,
  coerceComparisonExplanation,
  coerceGoldenManifestComparison,
  coerceGraphViewModel,
  coerceManifestSummary,
  coerceReplayResponse,
  coerceRunComparison,
  coerceRunDetail,
  coerceRunSummaryList,
  coerceRunSummaryPaged,
} from "@/lib/operator/operator-response-guards";

describe("coerceRunSummaryList", () => {
  it("accepts empty array", () => {
    const result = coerceRunSummaryList([]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items).toEqual([]);
    }
  });

  it("rejects non-array", () => {
    const result = coerceRunSummaryList({});

    expect(result.ok).toBe(false);
  });

  it("rejects row without runId", () => {
    const result = coerceRunSummaryList([{ projectId: "p" }]);

    expect(result.ok).toBe(false);
  });

  it("rejects row when runId is whitespace-only", () => {
    const result = coerceRunSummaryList([{ runId: "   ", projectId: "p" }]);

    expect(result.ok).toBe(false);
  });
});

describe("coerceRunSummaryPaged", () => {
  it("accepts cursor keyset envelope (requestedTake + hasMore) and synthesizes totals", () => {
    const result = coerceRunSummaryPaged(
      {
        items: [{ runId: "r1", projectId: "default", createdUtc: "2020-01-01T00:00:00Z" }],
        requestedTake: 20,
        hasMore: true,
        nextCursor: "abc",
      },
      { page: 1 },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(1);
      expect(result.value.pageSize).toBe(20);
      expect(result.value.totalCount).toBe(21);
      expect(result.value.nextCursor).toBe("abc");
    }
  });

  it("accepts empty items with valid paging fields", () => {
    const result = coerceRunSummaryPaged({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      hasMore: false,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toEqual([]);
      expect(result.value.totalCount).toBe(0);
    }
  });

  it("rejects paged rows when runId is whitespace-only", () => {
    const result = coerceRunSummaryPaged({
      items: [{ runId: "  \t  " }],
      totalCount: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects non-object", () => {
    expect(coerceRunSummaryPaged([]).ok).toBe(false);
  });

  it("rejects invalid hasMore", () => {
    const result = coerceRunSummaryPaged({
      items: [{ runId: "r1" }],
      totalCount: 1,
      page: 1,
      pageSize: 20,
      hasMore: "yes",
    });

    expect(result.ok).toBe(false);
  });

  it("rejects keyset envelope when requestedTake is negative", () => {
    const result = coerceRunSummaryPaged({
      items: [{ runId: "r1" }],
      requestedTake: -5,
      hasMore: false,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("requestedTake");
    }
  });

  it("rejects legacy offset envelope when pageSize is zero", () => {
    const result = coerceRunSummaryPaged({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 0,
      hasMore: false,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("pageSize");
    }
  });

  it("rejects legacy offset envelope when page is zero", () => {
    const result = coerceRunSummaryPaged({
      items: [],
      totalCount: 0,
      page: 0,
      pageSize: 20,
      hasMore: false,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("page");
    }
  });
});

describe("coerceGraphViewModel", () => {
  it("accepts empty nodes and edges", () => {
    const result = coerceGraphViewModel({ nodes: [], edges: [] });

    expect(result.ok).toBe(true);
  });

  it("rejects missing nodes", () => {
    const result = coerceGraphViewModel({ edges: [] });

    expect(result.ok).toBe(false);
  });
});

describe("coerceRunComparison", () => {
  it("accepts minimal legacy compare payload with empty diffs", () => {
    const result = coerceRunComparison({
      leftRunId: "L",
      rightRunId: "R",
      runLevelDiffs: [],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.runLevelDiffs).toEqual([]);
    }
  });

  it("rejects missing runLevelDiffs array", () => {
    expect(
      coerceRunComparison({
        leftRunId: "L",
        rightRunId: "R",
      }).ok,
    ).toBe(false);
  });

  it("rejects empty leftRunId", () => {
    expect(
      coerceRunComparison({
        leftRunId: "",
        rightRunId: "R",
        runLevelDiffs: [],
      }).ok,
    ).toBe(false);
  });

  it("reports missing run identifiers when leftRunId or rightRunId is whitespace-only", () => {
    const blankLeft = coerceRunComparison({
      leftRunId: "   ",
      rightRunId: "R",
      runLevelDiffs: [],
    });

    expect(blankLeft.ok).toBe(false);
    if (!blankLeft.ok) {
      expect(blankLeft.message).toBe("Run comparison is missing leftRunId or rightRunId.");
    }

    const blankRight = coerceRunComparison({
      leftRunId: "L",
      rightRunId: " \t ",
      runLevelDiffs: [],
    });

    expect(blankRight.ok).toBe(false);
    if (!blankRight.ok) {
      expect(blankRight.message).toBe("Run comparison is missing leftRunId or rightRunId.");
    }
  });
});

describe("coerceGoldenManifestComparison", () => {
  it("accepts minimal valid shape", () => {
    const result = coerceGoldenManifestComparison({
      baseRunId: "a",
      targetRunId: "b",
      decisionChanges: [],
      requirementChanges: [],
      securityChanges: [],
      topologyChanges: [],
      costChanges: [],
      summaryHighlights: [],
    });

    expect(result.ok).toBe(true);
  });

  it("rejects missing array section", () => {
    const result = coerceGoldenManifestComparison({
      baseRunId: "a",
      targetRunId: "b",
      decisionChanges: [],
    });

    expect(result.ok).toBe(false);
  });

  it("rejects empty baseRunId", () => {
    const result = coerceGoldenManifestComparison({
      baseRunId: "",
      targetRunId: "b",
      decisionChanges: [],
      requirementChanges: [],
      securityChanges: [],
      topologyChanges: [],
      costChanges: [],
      summaryHighlights: [],
    });

    expect(result.ok).toBe(false);
  });

  it("reports missing baseRunId or targetRunId when either is whitespace-only", () => {
    const blankBase = coerceGoldenManifestComparison({
      baseRunId: "   ",
      targetRunId: "b",
      decisionChanges: [],
      requirementChanges: [],
      securityChanges: [],
      topologyChanges: [],
      costChanges: [],
      summaryHighlights: [],
    });

    expect(blankBase.ok).toBe(false);
    if (!blankBase.ok) {
      expect(blankBase.message).toBe("Comparison response is missing baseRunId or targetRunId.");
    }

    const blankTarget = coerceGoldenManifestComparison({
      baseRunId: "a",
      targetRunId: " \n ",
      decisionChanges: [],
      requirementChanges: [],
      securityChanges: [],
      topologyChanges: [],
      costChanges: [],
      summaryHighlights: [],
    });

    expect(blankTarget.ok).toBe(false);
    if (!blankTarget.ok) {
      expect(blankTarget.message).toBe("Comparison response is missing baseRunId or targetRunId.");
    }
  });
});

describe("coerceReplayResponse", () => {
  it("accepts validation with notes", () => {
    const result = coerceReplayResponse({
      runId: "r",
      mode: "ReconstructOnly",
      replayedUtc: "2020-01-01T00:00:00Z",
      validation: {
        notes: [],
        manifestHashMatches: true,
        artifactBundlePresentAfterReplay: false,
      },
    });

    expect(result.ok).toBe(true);
  });

  it("rejects missing validation.notes", () => {
    const result = coerceReplayResponse({
      runId: "r",
      mode: "m",
      replayedUtc: "2020-01-01T00:00:00Z",
      validation: {},
    });

    expect(result.ok).toBe(false);
  });

  it("rejects whitespace-only runId", () => {
    const result = coerceReplayResponse({
      runId: "   ",
      mode: "m",
      replayedUtc: "2020-01-01T00:00:00Z",
      validation: {
        notes: [],
        manifestHashMatches: true,
        artifactBundlePresentAfterReplay: false,
      },
    });

    expect(result.ok).toBe(false);
  });

  it("reports missing runId when runId is whitespace-only", () => {
    const result = coerceReplayResponse({
      runId: "   ",
      mode: "m",
      replayedUtc: "2020-01-01T00:00:00Z",
      validation: {
        notes: [],
        manifestHashMatches: true,
        artifactBundlePresentAfterReplay: false,
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("Replay response is missing runId, mode, or replayedUtc.");
    }
  });

  it("rejects whitespace-only replayedUtc", () => {
    const result = coerceReplayResponse({
      runId: "r",
      mode: "m",
      replayedUtc: "   ",
      validation: {
        notes: [],
        manifestHashMatches: true,
        artifactBundlePresentAfterReplay: false,
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("Replay response is missing runId, mode, or replayedUtc.");
    }
  });
});

describe("coerceRunDetail", () => {
  it("accepts minimal run envelope", () => {
    const result = coerceRunDetail({
      run: {
        runId: "a",
        projectId: "p",
        createdUtc: "2020-01-01T00:00:00Z",
      },
    });

    expect(result.ok).toBe(true);
  });

  it("rejects missing run", () => {
    expect(coerceRunDetail({}).ok).toBe(false);
  });

  it("rejects whitespace-only runId or projectId", () => {
    expect(
      coerceRunDetail({
        run: {
          runId: "   ",
          projectId: "p",
          createdUtc: "2020-01-01T00:00:00Z",
        },
      }),
    ).toEqual({ ok: false, message: "Review detail is missing string runId or projectId." });

    expect(
      coerceRunDetail({
        run: {
          runId: "r",
          projectId: " \t ",
          createdUtc: "2020-01-01T00:00:00Z",
        },
      }),
    ).toEqual({ ok: false, message: "Review detail is missing string runId or projectId." });

    expect(
      coerceRunDetail({
        run: {
          runId: "r",
          projectId: "p",
          createdUtc: "   ",
        },
      }),
    ).toEqual({ ok: false, message: "Review detail is missing string createdUtc." });
  });
});

describe("coerceManifestSummary", () => {
  it("accepts valid summary", () => {
    const result = coerceManifestSummary({
      manifestId: "m",
      runId: "r",
      createdUtc: "2020-01-01T00:00:00Z",
      manifestHash: "h",
      ruleSetId: "rs",
      ruleSetVersion: "1",
      decisionCount: 0,
      warningCount: 0,
      unresolvedIssueCount: 0,
      status: "Committed",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects bad status type", () => {
    const result = coerceManifestSummary({
      manifestId: "m",
      runId: "r",
      createdUtc: "2020-01-01T00:00:00Z",
      manifestHash: "h",
      ruleSetId: "rs",
      ruleSetVersion: "1",
      decisionCount: 0,
      warningCount: 0,
      unresolvedIssueCount: 0,
      status: 1,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects whitespace-only manifestId", () => {
    const result = coerceManifestSummary({
      manifestId: "   ",
      runId: "r",
      createdUtc: "2020-01-01T00:00:00Z",
      manifestHash: "h",
      ruleSetId: "rs",
      ruleSetVersion: "1",
      decisionCount: 0,
      warningCount: 0,
      unresolvedIssueCount: 0,
      status: "Committed",
    });

    expect(result.ok).toBe(false);
  });

  it("reports invalid manifestId or runId when either is whitespace-only", () => {
    const blankManifestId = coerceManifestSummary({
      manifestId: "   ",
      runId: "r",
      createdUtc: "2020-01-01T00:00:00Z",
      manifestHash: "h",
      ruleSetId: "rs",
      ruleSetVersion: "1",
      decisionCount: 0,
      warningCount: 0,
      unresolvedIssueCount: 0,
      status: "Committed",
    });

    expect(blankManifestId.ok).toBe(false);
    if (!blankManifestId.ok) {
      expect(blankManifestId.message).toBe('Review record summary is missing or invalid "manifestId".');
    }

    const blankRunId = coerceManifestSummary({
      manifestId: "m",
      runId: " \t ",
      createdUtc: "2020-01-01T00:00:00Z",
      manifestHash: "h",
      ruleSetId: "rs",
      ruleSetVersion: "1",
      decisionCount: 0,
      warningCount: 0,
      unresolvedIssueCount: 0,
      status: "Committed",
    });

    expect(blankRunId.ok).toBe(false);
    if (!blankRunId.ok) {
      expect(blankRunId.message).toBe('Review record summary is missing or invalid "runId".');
    }
  });

  it("rejects whitespace-only manifestHash", () => {
    const result = coerceManifestSummary({
      manifestId: "m",
      runId: "r",
      createdUtc: "2020-01-01T00:00:00Z",
      manifestHash: "   ",
      ruleSetId: "rs",
      ruleSetVersion: "1",
      decisionCount: 0,
      warningCount: 0,
      unresolvedIssueCount: 0,
      status: "Committed",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe('Review record summary is missing or invalid "manifestHash".');
    }
  });

  it("rejects whitespace-only ruleSetId", () => {
    const result = coerceManifestSummary({
      manifestId: "m",
      runId: "r",
      createdUtc: "2020-01-01T00:00:00Z",
      manifestHash: "h",
      ruleSetId: "   ",
      ruleSetVersion: "1",
      decisionCount: 0,
      warningCount: 0,
      unresolvedIssueCount: 0,
      status: "Committed",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe('Review record summary is missing or invalid "ruleSetId".');
    }
  });
});

describe("coerceArtifactDescriptor", () => {
  it("accepts valid descriptor", () => {
    const result = coerceArtifactDescriptor({
      artifactId: "a",
      artifactType: "Inventory",
      name: "n",
      format: "json",
      createdUtc: "2020-01-01T00:00:00Z",
      contentHash: "h",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects missing format", () => {
    expect(
      coerceArtifactDescriptor({
        artifactId: "a",
        artifactType: "Inventory",
        name: "n",
        createdUtc: "2020-01-01T00:00:00Z",
        contentHash: "h",
      }).ok,
    ).toBe(false);
  });

  it("rejects whitespace-only artifactId", () => {
    expect(
      coerceArtifactDescriptor({
        artifactId: "   ",
        artifactType: "Inventory",
        name: "n",
        format: "json",
        createdUtc: "2020-01-01T00:00:00Z",
        contentHash: "h",
      }).ok,
    ).toBe(false);
  });

  it("reports invalid artifactId when artifactId is whitespace-only", () => {
    const result = coerceArtifactDescriptor({
      artifactId: "   ",
      artifactType: "Inventory",
      name: "n",
      format: "json",
      createdUtc: "2020-01-01T00:00:00Z",
      contentHash: "h",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe('Artifact descriptor is missing or invalid "artifactId".');
    }
  });

  it("rejects whitespace-only contentHash", () => {
    const result = coerceArtifactDescriptor({
      artifactId: "a",
      artifactType: "Inventory",
      name: "n",
      format: "json",
      createdUtc: "2020-01-01T00:00:00Z",
      contentHash: "   ",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe('Artifact descriptor is missing or invalid "contentHash".');
    }
  });

  it("rejects whitespace-only format", () => {
    const result = coerceArtifactDescriptor({
      artifactId: "a",
      artifactType: "Inventory",
      name: "n",
      format: " ",
      createdUtc: "2020-01-01T00:00:00Z",
      contentHash: "h",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe('Artifact descriptor is missing or invalid "format".');
    }
  });
});

describe("coerceArtifactDescriptorList", () => {
  it("accepts empty list", () => {
    expect(coerceArtifactDescriptorList([]).ok).toBe(true);
  });

  it("rejects row without artifactId", () => {
    expect(coerceArtifactDescriptorList([{ name: "n" }]).ok).toBe(false);
  });
});

describe("coerceComparisonExplanation", () => {
  it("rejects whitespace-only highLevelSummary", () => {
    const result = coerceComparisonExplanation({
      highLevelSummary: " ",
      narrative: "n",
      majorChanges: [],
      keyTradeoffs: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("AI explanation is missing highLevelSummary or narrative strings.");
    }
  });
});
