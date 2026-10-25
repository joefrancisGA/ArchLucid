import { describe, expect, it } from "vitest";

import type { RunSummary } from "@/types/authority";

import {
  filterRunsForHomeAttentionPreview,
  listHomeAttentionPreviewExcludedRunIds,
  resolveRunIdFromUnfinishedWorkRailItem,
} from "@/lib/operator/home-attention-dedup";
import type { UnfinishedWorkRailItem } from "@/lib/unfinished-work-rail";

function railItem(kind: UnfinishedWorkRailItem["kind"], id: string): UnfinishedWorkRailItem {
  return {
    id,
    kind,
    title: "Review",
    href: "/architecture/reviews/run-1",
    statusLabel: "Status",
    updatedUtc: null,
    workTypeLabel: "Architecture review",
    activityLabel: null,
    actionLabel: "Continue",
  };
}

describe("home-attention-dedup (TB-2369)", () => {
  it("lists active review run ids from unfinished-work rail items", () => {
    const runIds = listHomeAttentionPreviewExcludedRunIds([
      railItem("awaiting-disposition", "awaiting-disposition:run-1"),
      railItem("review-in-progress", "review-in-progress:run-2"),
    ]);

    expect(runIds).toEqual(["run-1", "run-2"]);
  });

  it("filters home attention preview when excluded run ids have surrounding whitespace", () => {
    const runs = [
      { runId: "run-1", projectId: "default" },
      { runId: "run-2", projectId: "default" },
    ] as RunSummary[];

    const filtered = filterRunsForHomeAttentionPreview(runs, [" run-1 "]);

    expect(filtered.map((run) => run.runId)).toEqual(["run-2"]);
  });

  it("filters home attention preview runs already on unfinished-work rail", () => {
    const runs = [
      { runId: "run-1", projectId: "default" },
      { runId: "run-2", projectId: "default" },
    ] as RunSummary[];

    const filtered = filterRunsForHomeAttentionPreview(runs, ["run-1"]);

    expect(filtered.map((run) => run.runId)).toEqual(["run-2"]);
  });

  it("returns all runs when excluded run id list is empty", () => {
    const runs = [
      { runId: "run-1", projectId: "default" },
      { runId: "run-2", projectId: "default" },
    ] as RunSummary[];

    const filtered = filterRunsForHomeAttentionPreview(runs, []);

    expect(filtered).toEqual(runs);
  });

  it("retains runs whose runId is whitespace-only when exclusions are nonempty", () => {
    const runs = [
      { runId: "   ", projectId: "default" },
      { runId: "run-2", projectId: "default" },
    ] as RunSummary[];

    const filtered = filterRunsForHomeAttentionPreview(runs, ["run-2"]);

    expect(filtered.map((run) => run.runId)).toEqual(["   "]);
  });

  it("resolveRunIdFromUnfinishedWorkRailItem returns null when id suffix is whitespace-only", () => {
    expect(
      resolveRunIdFromUnfinishedWorkRailItem(
        railItem("awaiting-disposition", "awaiting-disposition:   "),
      ),
    ).toBeNull();
  });

  it("lists run id from rail href when row id suffix is empty", () => {
    const runIds = listHomeAttentionPreviewExcludedRunIds([
      railItem("review-in-progress", "review-in-progress:"),
      railItem("awaiting-disposition", "awaiting-disposition:run-3"),
    ]);

    expect(runIds).toEqual(["run-1", "run-3"]);
  });

  it("filters home attention preview when rail row id suffix is empty but href encodes the run", () => {
    const runs = [
      { runId: "run-1", projectId: "default" },
      { runId: "run-2", projectId: "default" },
    ] as RunSummary[];

    const excluded = listHomeAttentionPreviewExcludedRunIds([
      railItem("review-in-progress", "review-in-progress:"),
    ]);

    expect(filterRunsForHomeAttentionPreview(runs, excluded).map((run) => run.runId)).toEqual(["run-2"]);
  });
});
