import { describe, expect, it } from "vitest";

import type { RunSummary } from "@/types/authority";

import {
  filterRunsForHomeAttentionPreview,
  listHomeAttentionPreviewExcludedRunIds,
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

  it("filters home attention preview runs already on unfinished-work rail", () => {
    const runs = [
      { runId: "run-1", projectId: "default" },
      { runId: "run-2", projectId: "default" },
    ] as RunSummary[];

    const filtered = filterRunsForHomeAttentionPreview(runs, ["run-1"]);

    expect(filtered.map((run) => run.runId)).toEqual(["run-2"]);
  });
});
