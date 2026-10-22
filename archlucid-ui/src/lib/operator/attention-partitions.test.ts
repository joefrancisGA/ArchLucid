import { describe, expect, it } from "vitest";

import {
  ATTENTION_PARTITION_SURFACE_MAP,
  attentionPartitionInventory,
  runWorkQueueAttentionPartition,
} from "@/lib/operator/attention-partitions";

describe("attention-partitions (TB-2369)", () => {
  it("maps run work queue groups to attention partitions", () => {
    expect(runWorkQueueAttentionPartition("needs-attention")).toBe("unfinished-work");
    expect(runWorkQueueAttentionPartition("in-progress")).toBe("unfinished-work");
    expect(runWorkQueueAttentionPartition("committed")).toBe("awaiting-approval");
  });

  it("lists every attention surface with a partition", () => {
    const inventory = attentionPartitionInventory();

    expect(inventory.length).toBe(Object.keys(ATTENTION_PARTITION_SURFACE_MAP).length);
    expect(inventory.every((row) => row.partition.length > 0)).toBe(true);
  });
});
