import type { AttentionPartition, AttentionPartitionSurfaceId } from "@/lib/operator/attention-partitions";
import { ATTENTION_PARTITION_SURFACE_MAP } from "@/lib/operator/attention-partitions";
import {
  OPERATOR_ATTENTION_KIND_LABELS,
  type OperatorAttentionKindId,
} from "@/lib/operator/operator-attention-taxonomy";

export type AttentionSurfaceCount = {
  readonly surfaceId: AttentionPartitionSurfaceId;
  readonly count: number;
};

export type AttentionPartitionSummary = {
  readonly partition: AttentionPartition;
  readonly label: string;
  readonly totalCount: number;
  readonly surfaces: readonly AttentionSurfaceCount[];
};

export type SummarizeAttentionSurfacesInput = Partial<Record<AttentionPartitionSurfaceId, number>>;

function normalizeCount(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value as number));
}

/** TB-2369 — roll attention surface counts into partition summaries for home + nav badges. */
export function summarizeAttentionSurfaces(
  input: SummarizeAttentionSurfacesInput,
): readonly AttentionPartitionSummary[] {
  const grouped = new Map<OperatorAttentionKindId, AttentionSurfaceCount[]>();

  for (const surfaceId of Object.keys(ATTENTION_PARTITION_SURFACE_MAP) as AttentionPartitionSurfaceId[]) {
    const partition = ATTENTION_PARTITION_SURFACE_MAP[surfaceId];
    const count = normalizeCount(input[surfaceId]);
    const existing = grouped.get(partition) ?? [];

    existing.push({ surfaceId, count });
    grouped.set(partition, existing);
  }

  return [...grouped.entries()]
    .map(([partition, surfaces]) => ({
      partition,
      label: OPERATOR_ATTENTION_KIND_LABELS[partition],
      totalCount: surfaces.reduce((total, row) => total + row.count, 0),
      surfaces: [...surfaces].sort((left, right) => left.surfaceId.localeCompare(right.surfaceId)),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}
