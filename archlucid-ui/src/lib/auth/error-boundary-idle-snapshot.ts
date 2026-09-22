import {
  mergeLivelihoodIdleFormSnapshotIntoDeskRestore,
  persistIdleDeskRestoreBeforeSessionClear,
  readIdleDeskRestorePayload,
} from "@/lib/auth/idle-desk-restore";
import type { LivelihoodIdleFormSnapshot } from "@/lib/auth/livelihood-idle-form-snapshot";

/** Best-effort flush before error recovery UI — never throws; does not log snapshot contents (LW-095). */
export function persistLivelihoodIdleSnapshotsBeforeErrorRecovery(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const returnPath = `${window.location.pathname}${window.location.search}`;
    persistIdleDeskRestoreBeforeSessionClear(returnPath);

    const payload = readIdleDeskRestorePayload();
    const formSnapshots = payload?.formSnapshots;

    return formSnapshots !== undefined && Object.keys(formSnapshots).length > 0;
  } catch {
    return false;
  }
}

/** Merges one registered snapshot into idle desk restore storage (layout-unmount flush). */
export function flushLivelihoodIdleFormSnapshotBeforeUnmount(
  snapshotKey: string,
  snapshot: LivelihoodIdleFormSnapshot,
): void {
  try {
    mergeLivelihoodIdleFormSnapshotIntoDeskRestore(snapshotKey, snapshot);
  } catch {
    /* quota / private mode */
  }
}
