import {
  resolveSpawnLockHandoffSnapshotSummaryRows,
  SPAWN_LOCK_HANDOFF_LAYOUT_TEST_IDS,
} from "@/lib/system-not-job-spawn-lock-handoff-layout";
import type { SpawnLockHandoffSnapshotSummaryInput } from "@/lib/system-not-job-spawn-lock-handoff-layout";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ArchitectureDraftSpawnLockSnapshotSummaryProps = SpawnLockHandoffSnapshotSummaryInput;

/** SN-013: frozen field summary for spawn-locked handoff — not an editable form. */
export function ArchitectureDraftSpawnLockSnapshotSummary(
  props: ArchitectureDraftSpawnLockSnapshotSummaryProps,
): React.JSX.Element {
  const rows = resolveSpawnLockHandoffSnapshotSummaryRows(props);

  return (
    <dl
      className="m-0 grid gap-3 sm:grid-cols-2"
      data-testid={SPAWN_LOCK_HANDOFF_LAYOUT_TEST_IDS.snapshotSummary}
    >
      {rows.map((row) => (
        <div key={row.label} className={row.wide === true ? "sm:col-span-2" : undefined}>
          <dt className={OPERATOR_TYPOGRAPHY.helper}>{row.label}</dt>
          <dd
            className={cn(
              "m-0",
              OPERATOR_TYPOGRAPHY.body,
              row.wide === true ? "whitespace-pre-wrap" : undefined,
            )}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
