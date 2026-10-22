import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  ATTENTION_PARTITION_SURFACE_MAP,
  attentionPartitionInventory,
  runWorkQueueAttentionPartition,
} from "@/lib/operator/attention-partitions";
import {
  ATTENTION_SURFACE_INVENTORY,
  assertAttentionSurfaceInventoryCoversTaxonomy,
  listAttentionSurfaceInventoryEntries,
} from "@/lib/operator/attention-surface-inventory";
import { OPERATOR_ATTENTION_SURFACE_KIND_MAP } from "@/lib/operator/operator-attention-taxonomy";

const libDir = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(libDir, "..", "..");

function readComponentSource(relativePath: string): string {
  return readFileSync(join(srcRoot, relativePath), "utf8");
}

describe("attention-surface-inventory (TB-2369)", () => {
  it("lists every partition surface with a partition and unique surface ids", () => {
    const partitionInventory = attentionPartitionInventory();
    const inventory = listAttentionSurfaceInventoryEntries();
    const partitionSurfaceIds = Object.keys(ATTENTION_PARTITION_SURFACE_MAP);

    expect(partitionInventory.length).toBe(partitionSurfaceIds.length);
    expect(inventory.length).toBeGreaterThan(partitionInventory.length);

    const ids = inventory.map((entry) => entry.surfaceId);
    expect(new Set(ids).size).toBe(ids.length);

    for (const entry of inventory) {
      expect(entry.partition.length).toBeGreaterThan(0);

      if (entry.surfaceId in OPERATOR_ATTENTION_SURFACE_KIND_MAP) {
        expect(OPERATOR_ATTENTION_SURFACE_KIND_MAP[entry.surfaceId]).toBe(entry.partition);
      }

      if (entry.surfaceId in ATTENTION_PARTITION_SURFACE_MAP) {
        expect(ATTENTION_PARTITION_SURFACE_MAP[entry.surfaceId as keyof typeof ATTENTION_PARTITION_SURFACE_MAP]).toBe(
          entry.partition,
        );
      }
    }
  });

  it("covers every taxonomy surface with the same partition", () => {
    assertAttentionSurfaceInventoryCoversTaxonomy();
  });

  it("maps inventoried component test ids to mounted markers", () => {
    const entriesWithTestIds = ATTENTION_SURFACE_INVENTORY.filter((entry) => entry.testId !== null);

    for (const entry of entriesWithTestIds) {
      const source = readComponentSource(entry.componentPath);

      if (entry.surfaceId.startsWith("run-work-queue-")) {
        expect(source).toContain("data-testid={headingId}");
        expect(source).toContain("runWorkQueueAttentionPartition");
      } else {
        expect(source).toContain(entry.testId);
      }

      expect(source).toContain("data-attention-partition");
    }
  });
});
