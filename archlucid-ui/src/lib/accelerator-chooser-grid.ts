import {
  ACCELERATOR_CHOOSER_ENTRIES,
  ACCELERATOR_COST_GOVERNANCE_CLOUD_OPTIONS,
  ACCELERATOR_COST_GOVERNANCE_GROUP_ID,
  ACCELERATOR_COST_GOVERNANCE_PACK_IDS,
  type AcceleratorChooserEntry,
  isAcceleratorCostGovernancePackId,
} from "@/lib/accelerator-chooser";
import { ACCELERATOR_GREENFIELD_PACK_ID } from "@/lib/accelerator-chooser-pack-prerequisite";
import type { AcceleratorChooserPrerequisiteStatus } from "@/lib/resolve-accelerator-chooser-prerequisite-status";

export type AcceleratorChooserGridItem =
  | { readonly kind: "pack"; readonly entry: AcceleratorChooserEntry }
  | { readonly kind: "cost-governance-group" };

/** Grid rows for accelerator chooser UIs — collapses Azure/AWS/GCP cost packs into one grouped row. */
export function buildAcceleratorChooserGridItems(
  entries: readonly AcceleratorChooserEntry[] = ACCELERATOR_CHOOSER_ENTRIES,
): readonly AcceleratorChooserGridItem[] {
  const items: AcceleratorChooserGridItem[] = [];
  let costGroupInserted = false;

  for (const entry of entries) {
    if (isAcceleratorCostGovernancePackId(entry.id)) {
      if (!costGroupInserted) {
        items.push({ kind: "cost-governance-group" });
        costGroupInserted = true;
      }

      continue;
    }

    items.push({ kind: "pack", entry });
  }

  return items;
}

/** Hoists the greenfield pack first when prerequisite is not met so the available path is prominent (HAX). */
export function buildAcceleratorChooserGridItemsForPrerequisite(
  status: AcceleratorChooserPrerequisiteStatus,
  entries: readonly AcceleratorChooserEntry[] = ACCELERATOR_CHOOSER_ENTRIES,
): readonly AcceleratorChooserGridItem[] {
  const items = [...buildAcceleratorChooserGridItems(entries)];

  if (status !== "not-met") {
    return items;
  }

  const greenfieldIndex = items.findIndex(
    (item) => item.kind === "pack" && item.entry.id === ACCELERATOR_GREENFIELD_PACK_ID,
  );

  if (greenfieldIndex <= 0) {
    return items;
  }

  const [greenfieldItem] = items.splice(greenfieldIndex, 1);

  items.unshift(greenfieldItem);

  return items;
}

export function resolveAcceleratorCostGovernancePackEntry(
  packId: (typeof ACCELERATOR_COST_GOVERNANCE_PACK_IDS)[number],
  entries: readonly AcceleratorChooserEntry[] = ACCELERATOR_CHOOSER_ENTRIES,
): AcceleratorChooserEntry {
  const entry = entries.find((candidate) => candidate.id === packId);

  if (entry === undefined) {
    throw new Error(`Missing accelerator cost governance pack: ${packId}`);
  }

  return entry;
}

export const ACCELERATOR_COST_GOVERNANCE_GROUP_ROW_TEST_ID = `accelerator-chooser-row-${ACCELERATOR_COST_GOVERNANCE_GROUP_ID}`;

export const ACCELERATOR_COST_GOVERNANCE_HELP_PACK_TEST_ID = `help-accelerator-chooser-pack-${ACCELERATOR_COST_GOVERNANCE_GROUP_ID}`;

export { ACCELERATOR_COST_GOVERNANCE_CLOUD_OPTIONS };
