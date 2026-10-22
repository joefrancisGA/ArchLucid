import {
  ACCELERATOR_CHOOSER_ENTRIES,
  ACCELERATOR_COST_GOVERNANCE_GROUP_ID,
} from "@/lib/accelerator-chooser";
import { buildAcceleratorChooserGridItemsForPrerequisite } from "@/lib/accelerator-chooser-grid";
import type { AcceleratorChooserPrerequisiteStatus } from "@/lib/resolve-accelerator-chooser-prerequisite-status";

/** Registry markdown anchor for contributor pack-table drift checks (TB-1607). */
export const ACCELERATOR_CHOOSER_MARKDOWN_INVENTORY_SOURCE_PATH =
  "docs/go-to-market/DEMO_QUICKSTART.md" as const;

/** In-app surfaces that must render pack rows from `ACCELERATOR_CHOOSER_ENTRIES` via the shared grid builder. */
export const ACCELERATOR_CHOOSER_GRID_SURFACE_SOURCE_FILES: readonly string[] = [
  "src/components/accelerator/AcceleratorJobChooserList.tsx",
  "src/app/(operator)/help/_sections/HelpAcceleratorChooserGuideView.tsx",
] as const;

export const ACCELERATOR_CHOOSER_GRID_BUILDER_EXPORT = "buildAcceleratorChooserGridItemsForPrerequisite" as const;

export function listAcceleratorChooserEntryIds(): readonly string[] {
  return ACCELERATOR_CHOOSER_ENTRIES.map((entry) => entry.id);
}

export function listAcceleratorChooserGridRowIds(
  status: AcceleratorChooserPrerequisiteStatus = "met",
): readonly string[] {
  return buildAcceleratorChooserGridItemsForPrerequisite(status).map((item) =>
    item.kind === "cost-governance-group" ? ACCELERATOR_COST_GOVERNANCE_GROUP_ID : item.entry.id,
  );
}

export function sourceUsesAcceleratorChooserGridBuilder(source: string): boolean {
  return (
    source.includes(ACCELERATOR_CHOOSER_GRID_BUILDER_EXPORT) &&
    source.includes("@/lib/accelerator-chooser-grid")
  );
}

/** Contributor markdown uses wizard preset wording for greenfield instead of the TS pack id slug. */
export function resolveAcceleratorChooserMarkdownInventoryMarkers(packId: string): readonly string[] {
  if (packId === "greenfield-web-app") {
    return ["Greenfield web app", "greenfield presets"];
  }

  return [packId];
}

export function markdownSectionListsAcceleratorChooserPackId(section: string, packId: string): boolean {
  return resolveAcceleratorChooserMarkdownInventoryMarkers(packId).some((marker) => section.includes(marker));
}
