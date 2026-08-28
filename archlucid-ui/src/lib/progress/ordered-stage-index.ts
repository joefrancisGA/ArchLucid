export type OrderedStage<TStageId extends string> = {
  readonly id: TStageId;
};

/**
 * Position of the active stage inside an ordered stage list.
 * An unknown or absent id resolves to the first stage so progress chrome never renders blank.
 */
export function orderedStageIndex<TStageId extends string>(
  stages: readonly OrderedStage<TStageId>[],
  activeStageId: TStageId | null,
): number {
  if (activeStageId === null) {
    return 0;
  }

  const index = stages.findIndex((stage) => stage.id === activeStageId);

  return index >= 0 ? index : 0;
}
