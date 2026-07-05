export type OperatorHomeContinueSetupPlacement = "prominent" | "hidden";

export type ResolveOperatorHomeContinueSetupPlacementInput = {
  readonly phase: "loading" | "ready";
  readonly readyCount: number;
  readonly totalCount: number;
  readonly requiredStepsComplete: boolean;
};

/** Where the Overview Continue setup card belongs relative to first-review hero content. */
export function resolveOperatorHomeContinueSetupPlacement(
  input: ResolveOperatorHomeContinueSetupPlacementInput,
): OperatorHomeContinueSetupPlacement {
  if (input.phase === "ready") {
    if (input.requiredStepsComplete || input.readyCount >= input.totalCount) {
      return "hidden";
    }
  }

  return "prominent";
}
