import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

import {
  resolveGovernanceFindingResourceGroup,
} from "@/lib/resolve-governance-finding-resource-group";

export type GovernanceFindingQueueResourceGroup = {
  key: string;
  label: string;
  rows: GovernanceFindingQueueRow[];
};

export function groupGovernanceFindingQueueRows(
  rows: readonly GovernanceFindingQueueRow[],
): GovernanceFindingQueueResourceGroup[] {
  const order: string[] = [];
  const map = new Map<string, GovernanceFindingQueueResourceGroup>();

  for (const row of rows) {
    const group = resolveGovernanceFindingResourceGroup(row);
    let bucket = map.get(group.key);

    if (bucket === undefined) {
      bucket = {
        key: group.key,
        label: group.label,
        rows: [],
      };
      map.set(group.key, bucket);
      order.push(group.key);
    }

    bucket.rows.push(row);
  }

  const groups = order.map((key) => map.get(key)!);

  groups.sort((left, right) => {
    if (right.rows.length !== left.rows.length) {
      return right.rows.length - left.rows.length;
    }

    return left.label.localeCompare(right.label, undefined, { sensitivity: "base" });
  });

  return groups;
}
