import {
  advanceOperateNavUnlockToGovernance,
  writeOperateNavUnlockPhase,
  type OperateNavUnlockPhase,
} from "@/lib/usability/operate-nav-progressive-unlock";

/** Maps the V1 advanced-features toggle to operate-governance nav unlock phase. */
export function operateNavUnlockPhaseForAdvancedFeatures(advancedFeaturesEnabled: boolean): OperateNavUnlockPhase {
  return advancedFeaturesEnabled ? 2 : 1;
}

export function syncOperateNavUnlockWithAdvancedFeatures(advancedFeaturesEnabled: boolean): void {
  if (advancedFeaturesEnabled) {
    advanceOperateNavUnlockToGovernance();

    return;
  }

  writeOperateNavUnlockPhase(1);
}
