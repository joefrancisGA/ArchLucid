import { DEFAULT_MAX_FINDINGS } from "@/lib/adr-from-run-slices";
import { sortQuickDecisionFindings, type QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

export type CareerExportFindingInventory = {
  readonly included: number;
  readonly total: number;
  readonly isComplete: boolean;
};

export const CAREER_EXPORT_EVAL_SAMPLE_MAX_FINDINGS = DEFAULT_MAX_FINDINGS;

export function countCareerExportEligibleFindings(
  findings: readonly QuickDecisionFinding[],
): number {
  return sortQuickDecisionFindings(findings).filter((finding) => finding.isMuted !== true).length;
}

export function resolveCareerExportMaxFindings(args: {
  readonly workingDesk: boolean;
  readonly evalSampleExport: boolean;
}): number | null {
  if (args.workingDesk) {
    return null;
  }

  if (args.evalSampleExport) {
    return CAREER_EXPORT_EVAL_SAMPLE_MAX_FINDINGS;
  }

  return null;
}

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

export function resolveCareerExportFindingInventoryForExport(args: {
  readonly totalEligibleFindings: number;
  readonly maxFindings: number | null;
}): CareerExportFindingInventory {
  const total = Math.max(0, Math.trunc(args.totalEligibleFindings));
  const cap =
    args.maxFindings === null
      ? Number.POSITIVE_INFINITY
      : Math.max(0, Math.trunc(args.maxFindings));
  const included = Math.min(total, cap);

  return resolveCareerExportFindingInventory({ included, total });
}

export function capAdrGeneratorFindingsForExport<T extends { readonly findings: readonly unknown[] }>(
  input: T,
  maxFindings: number | null,
): T {
  if (maxFindings === null) {
    return input;
  }

  const cap = Math.max(0, Math.trunc(maxFindings));

  return {
    ...input,
    findings: input.findings.slice(0, cap),
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
