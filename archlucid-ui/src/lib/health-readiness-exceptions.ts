import type {
  HealthDisplaySeverity,
  PresentedReadinessCategoryGroup,
  PresentedReadinessRow,
} from "@/lib/health-readiness-presentation";

export type HealthExceptionRow = {
  readonly row: PresentedReadinessRow;
  /** Section the row came from ("Data stores", "Critical dependencies") — shown as row context. */
  readonly groupTitle: string;
};

/** Blocking states sort first; optional/unconfigured gaps sort last. */
const EXCEPTION_ORDER: Readonly<Record<HealthDisplaySeverity, number>> = {
  failing: 5,
  degraded: 4,
  advisory: 3,
  unknown: 2,
  "not-configured": 1,
  healthy: 0,
};

export function isHealthExceptionSeverity(severity: HealthDisplaySeverity): boolean {
  return EXCEPTION_ORDER[severity] > 0;
}

/**
 * Every non-healthy row across readiness groups plus caller-supplied rows (critical
 * dependencies), de-duplicated by check id so a dependency reported on both surfaces
 * is listed once, worst state first.
 */
export function selectHealthExceptionRows(
  groups: readonly PresentedReadinessCategoryGroup[],
  extraRows: readonly HealthExceptionRow[] = [],
): HealthExceptionRow[] {
  const fromGroups = groups.flatMap((group) =>
    group.rows
      .filter((row) => isHealthExceptionSeverity(row.severity))
      .map((row) => ({ row, groupTitle: group.category.title })),
  );
  const fromExtras = extraRows.filter((candidate) => isHealthExceptionSeverity(candidate.row.severity));
  const candidates = [...fromGroups, ...fromExtras];

  // First occurrence wins, so a readiness group keeps ownership of a shared check id.
  return candidates
    .filter(
      (candidate, index) =>
        candidates.findIndex((other) => other.row.checkId === candidate.row.checkId) === index,
    )
    .sort((left, right) => EXCEPTION_ORDER[right.row.severity] - EXCEPTION_ORDER[left.row.severity]);
}
