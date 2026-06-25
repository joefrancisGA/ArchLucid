import {
  advanceOperateNavUnlockToGovernance,
  readOperateNavUnlockPhase,
  writeOperateNavUnlockPhase,
  type OperateNavUnlockPhase,
} from "@/lib/usability/operate-nav-progressive-unlock";

/** Combines persisted pilot unlock phase with the sidebar advanced-features toggle for palette visibility. */
export function resolveOperateNavUnlockPhase(
  storedPhase: OperateNavUnlockPhase,
  advancedFeaturesEnabled: boolean,
): OperateNavUnlockPhase {
  if (advancedFeaturesEnabled || storedPhase >= 2) {
    return 2;
  }

  return storedPhase;
}

/** @deprecated Prefer {@link resolveOperateNavUnlockPhase} with a stored phase from {@link readOperateNavUnlockPhase}. */
export function operateNavUnlockPhaseForAdvancedFeatures(advancedFeaturesEnabled: boolean): OperateNavUnlockPhase {
  return resolveOperateNavUnlockPhase(readOperateNavUnlockPhase(), advancedFeaturesEnabled);
}

export function syncOperateNavUnlockWithAdvancedFeatures(advancedFeaturesEnabled: boolean): void {
  if (advancedFeaturesEnabled) {
    advanceOperateNavUnlockToGovernance();

    return;
  }

  if (readOperateNavUnlockPhase() >= 1) {
    writeOperateNavUnlockPhase(1);
  }
}
