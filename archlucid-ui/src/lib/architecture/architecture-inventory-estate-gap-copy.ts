import type { ArchitectureInventoryBindingResponse } from "@/lib/api/architecture-inventory-binding-api";

/** TB-645 — unbound architecture must not read as zero Azure resources (AS-051). */
export const ARCHITECTURE_INVENTORY_UNBOUND_ESTATE_GAP_LINE =
  "No inventory snapshot bound — estate not in this review." as const;

export const ARCHITECTURE_INVENTORY_UNBOUND_ESTATE_GAP_HELPER =
  "This review does not include live Azure estate from an inventory snapshot. Findings are not an all-clear on cloud resources." as const;

export const ARCHITECTURE_INVENTORY_ESTATE_GAP_CAREER_EXPORT_HEADING = "Inventory estate" as const;

export const ARCHITECTURE_INVENTORY_ESTATE_NOT_STORED_LINE =
  "Inventory binding was not stored. This export is not an all-clear on cloud resources." as const;

export type ArchitectureInventoryEstateGapState = "unbound" | "bound" | "unknown";

export function resolveArchitectureInventoryEstateGapState(
  binding: ArchitectureInventoryBindingResponse | null | undefined,
): ArchitectureInventoryEstateGapState {
  if (binding === null || binding === undefined) {
    return "unknown";
  }

  if (binding.isBound === true) {
    return "bound";
  }

  if (binding.isBound === false) {
    return "unbound";
  }

  return "unknown";
}

export function formatArchitectureInventoryUnboundEstateGapLine(
  binding: ArchitectureInventoryBindingResponse | null | undefined,
): string | null {
  if (resolveArchitectureInventoryEstateGapState(binding) !== "unbound") {
    return null;
  }

  return ARCHITECTURE_INVENTORY_UNBOUND_ESTATE_GAP_LINE;
}

export function formatArchitectureInventoryEstateGapCareerExportMarkdown(
  architectureInventoryBound: boolean | null | undefined,
): string {
  if (architectureInventoryBound === null || architectureInventoryBound === undefined) {
    return `## ${ARCHITECTURE_INVENTORY_ESTATE_GAP_CAREER_EXPORT_HEADING}\n\n${ARCHITECTURE_INVENTORY_ESTATE_NOT_STORED_LINE}\n`;
  }

  if (architectureInventoryBound !== false) {
    return "";
  }

  return `## ${ARCHITECTURE_INVENTORY_ESTATE_GAP_CAREER_EXPORT_HEADING}\n\n${ARCHITECTURE_INVENTORY_UNBOUND_ESTATE_GAP_LINE}\n`;
}
