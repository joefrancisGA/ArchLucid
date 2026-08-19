import {
  advanceOperateNavUnlockToGovernance,
  readOperateNavUnlockPhase,
  writeOperateNavUnlockPhase,
  type OperateNavUnlockPhase,
} from "@/lib/usability/operate-nav-progressive-unlock";

/** Combines persisted pilot unlock phase with sidebar disclosure toggles for palette visibility. */
export function resolveOperateNavUnlockPhase(
  storedPhase: OperateNavUnlockPhase,
  advancedFeaturesEnabled: boolean,
  hasCommittedArchitectureReview = false,
): OperateNavUnlockPhase {
  if (storedPhase >= 2) {
    return 2;
  }

  if (advancedFeaturesEnabled && (hasCommittedArchitectureReview || storedPhase >= 1)) {
    return 2;
  }

  return storedPhase;
}

/** @deprecated Prefer {@link resolveOperateNavUnlockPhase} with a stored phase from {@link readOperateNavUnlockPhase}. */
export function operateNavUnlockPhaseForAdvancedFeatures(advancedFeaturesEnabled: boolean): OperateNavUnlockPhase {
  return resolveOperateNavUnlockPhase(readOperateNavUnlockPhase(), advancedFeaturesEnabled, false);
}

export function syncOperateNavUnlockWithAdvancedFeatures(advancedFeaturesEnabled: boolean): void {
  if (advancedFeaturesEnabled) {
    advanceOperateNavUnlockToGovernance("disclosure-toggle");

    return;
  }

  if (readOperateNavUnlockPhase() >= 1) {
    writeOperateNavUnlockPhase(1, "disclosure-toggle");
  }
}
