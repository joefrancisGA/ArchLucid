import { parseArchitectureNestedToolArchitectureId } from "@/lib/architecture/architecture-routes";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_FINDINGS_ARE_VERBS_DOC_ANCHOR =
  "docs/architecture/adrs/0079-working-desk-is-the-work-surface.md" as const;

export const SYSTEM_NOT_JOB_FINDINGS_ARE_VERBS_OWNER = "SN-023" as const;

export type SystemNotJobFindingsSurface = "nested-desk" | "governance-register";

/** SN-023 copy surfaces — governance register vs nested desk findings (routes stay separate). */
export const SYSTEM_NOT_JOB_FINDINGS_COPY_SURFACES: readonly string[] = [
  "archlucid-ui/src/app/(operator)/governance/findings/governance-findings-queue-presentation.ts",
  "archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueHeader.tsx",
  "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/findings/ArchitectureNestedFindingsPageClient.tsx",
];

/** Working `/governance/findings` — cross-architecture register, not the daily desk home. */
export const SYSTEM_NOT_JOB_WORKING_GOVERNANCE_FINDINGS_PAGE_SUBTITLE =
  "Cross-architecture risk register for this workspace — disposition and ownership across every review. Daily findings for the open system are on the architecture desk (Alt+G), not here." as const;

/** Working nested `/architecture/architectures/{id}/findings` — inhabit verb for this system (IH-003). */
export const SYSTEM_NOT_JOB_WORKING_NESTED_FINDINGS_PAGE_SUBTITLE =
  "Afternoon document for this architecture — disposition rows are the work. The open child review is a subtitle; use the workspace findings queue only for cross-architecture register." as const;

export const SYSTEM_NOT_JOB_WORKING_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE =
  "This queue is the cross-architecture register — not your Monday-morning desk. Open Architectures and press Alt+G for findings on the named system you are working." as const;

export const SYSTEM_NOT_JOB_WORKING_NESTED_FINDINGS_CLAIM_DISCIPLINE =
  "You inhabit this architecture on the desk. Findings here are verbs on this system; use the workspace queue when you need every system." as const;

export function resolveSystemNotJobFindingsSurface(pathname: string | null | undefined): SystemNotJobFindingsSurface {
  const nestedArchitectureId = parseArchitectureNestedToolArchitectureId(pathname ?? "", "findings");

  if (nestedArchitectureId !== null && nestedArchitectureId.trim().length > 0) {
    return "nested-desk";
  }

  return "governance-register";
}

export type ResolveSystemNotJobGovernanceFindingsCopyInput = {
  readonly workingMode: boolean;
  readonly pathname: string | null;
  readonly guidedCopy: string;
};

/** SN-023 / ADR 0079 — Working splits governance register copy from nested desk findings. */
export function resolveSystemNotJobGovernanceFindingsPageSubtitle(
  input: ResolveSystemNotJobGovernanceFindingsCopyInput,
): string {

  if (!input.workingMode) {
    return input.guidedCopy;
  }

  if (resolveSystemNotJobFindingsSurface(input.pathname) === "nested-desk") {
    return SYSTEM_NOT_JOB_WORKING_NESTED_FINDINGS_PAGE_SUBTITLE;
  }

  return SYSTEM_NOT_JOB_WORKING_GOVERNANCE_FINDINGS_PAGE_SUBTITLE;
}

export function resolveSystemNotJobGovernanceFindingsClaimDiscipline(
  input: ResolveSystemNotJobGovernanceFindingsCopyInput,
): string {

  if (!input.workingMode) {
    return input.guidedCopy;
  }

  if (resolveSystemNotJobFindingsSurface(input.pathname) === "nested-desk") {
    return SYSTEM_NOT_JOB_WORKING_NESTED_FINDINGS_CLAIM_DISCIPLINE;
  }

  return SYSTEM_NOT_JOB_WORKING_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE;
}
