/** Built-in engine types that require Actor nodes (DX-03 / DX-15). */
export const ACTOR_DEPENDENT_FINDING_ENGINE_TYPES = [
  "external-exposure",
  "trust-boundary",
  "privileged-access",
] as const;

export type ActorDependentFindingEngineType = (typeof ACTOR_DEPENDENT_FINDING_ENGINE_TYPES)[number];
