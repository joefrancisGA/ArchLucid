import { describe, expect, it } from "vitest";

import { ATTENTION_PARTITION_SURFACE_MAP } from "@/lib/operator/attention-partitions";
import { summarizeAttentionSurfaces } from "@/lib/operator/attention-summary";
import { OPERATOR_ATTENTION_KIND_LABELS } from "@/lib/operator/operator-attention-taxonomy";

describe("attention-summary (TB-2369)", () => {
  it("rolls surface counts into partition summaries with taxonomy labels", () => {
    const summaries = summarizeAttentionSurfaces({
      "unfinished-work-rail": 2,
      "run-work-queue-needs-attention": 1,
      "assigned-to-me-findings": 4,
      "alerts-nav": 3,
      "governance-awaiting-nav-badge": 1,
    });

    const unfinished = summaries.find((row) => row.partition === "unfinished-work");
    const assigned = summaries.find((row) => row.partition === "assigned-to-me");
    const alerts = summaries.find((row) => row.partition === "alerts");
    const awaiting = summaries.find((row) => row.partition === "awaiting-approval");

    expect(unfinished?.totalCount).toBe(3);
    expect(unfinished?.label).toBe(OPERATOR_ATTENTION_KIND_LABELS["unfinished-work"]);
    expect(assigned?.totalCount).toBe(4);
    expect(alerts?.totalCount).toBe(3);
    expect(awaiting?.totalCount).toBe(1);
  });

  it("lists every inventoried surface under a partition", () => {
    const summaries = summarizeAttentionSurfaces({});
    const surfaceIds = summaries.flatMap((row) => row.surfaces.map((surface) => surface.surfaceId));

    expect(surfaceIds.sort()).toEqual(
      (Object.keys(ATTENTION_PARTITION_SURFACE_MAP) as Array<keyof typeof ATTENTION_PARTITION_SURFACE_MAP>).sort(),
    );
  });
});
