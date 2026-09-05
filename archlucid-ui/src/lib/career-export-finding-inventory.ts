import { DEFAULT_MAX_FINDINGS } from "@/lib/adr-from-run-slices";

export type CareerExportFindingInventory = {
  readonly included: number;
  readonly total: number;
  readonly isComplete: boolean;
};

export const CAREER_EXPORT_EVAL_SAMPLE_MAX_FINDINGS = DEFAULT_MAX_FINDINGS;

export function resolveCareerExportFindingInventory(args: {
  readonly included: number;
  readonly total: number;
}): CareerExportFindingInventory {
  const included = Math.max(0, Math.trunc(args.included));
  const total = Math.max(0, Math.trunc(args.total));

  return {
    included,
    total,
    isComplete: included >= total,
  };
}

export function formatCareerExportFindingInventoryLine(inventory: CareerExportFindingInventory): string | null {
  if (inventory.isComplete) {
    return null;
  }

  return `This export includes ${inventory.included} of ${inventory.total} findings`;
}

export const CAREER_EXPORT_INCOMPLETE_CONFIRM_LABEL = "Export incomplete sample";

export const CAREER_EXPORT_EVAL_SAMPLE_LABEL = "Sample export — not a complete career inventory";
