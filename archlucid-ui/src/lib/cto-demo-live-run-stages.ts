export type CtoDemoLiveRunStageState = "pending" | "running" | "complete";

export type CtoDemoLiveRunStage = {
  readonly id: string;
  readonly label: string;
  readonly state: CtoDemoLiveRunStageState;
};

export const CTO_DEMO_LIVE_RUN_STAGE_DEFINITIONS: readonly { readonly id: string; readonly label: string }[] = [
  { id: "brief", label: "Analyzing architecture brief…" },
  { id: "policy", label: "Applying policy pack…" },
  { id: "findings", label: "Identifying findings…" },
  { id: "decisions", label: "Drafting signed decisions…" },
  { id: "audit", label: "Generating audit record…" },
];

export function mapStageTimelineToLiveRunStages(
  completedStageCount: number,
  totalStages: number,
  isFinalized: boolean,
): readonly CtoDemoLiveRunStage[] {
  const safeCompleted = Math.max(0, Math.min(completedStageCount, totalStages));

  return CTO_DEMO_LIVE_RUN_STAGE_DEFINITIONS.map((stage, index) => {
    if (isFinalized || index < safeCompleted) {
      return { ...stage, state: "complete" as const };
    }

    if (index === safeCompleted) {
      return { ...stage, state: "running" as const };
    }

    return { ...stage, state: "pending" as const };
  });
}
