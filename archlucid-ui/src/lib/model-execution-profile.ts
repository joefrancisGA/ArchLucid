export const MODEL_EXECUTION_PROFILES = ["Economy", "Balanced", "HighAssurance"] as const;

export type ModelExecutionProfile = (typeof MODEL_EXECUTION_PROFILES)[number];

export type ModelExecutionProfileSelection = ModelExecutionProfile | "WorkspaceDefault";

export function isModelExecutionProfile(value: string): value is ModelExecutionProfile {
  return (MODEL_EXECUTION_PROFILES as readonly string[]).includes(value);
}

export function modelExecutionProfileLabel(profile: ModelExecutionProfileSelection): string {
  switch (profile) {
    case "Economy":
      return "Economy";
    case "Balanced":
      return "Balanced";
    case "HighAssurance":
      return "High assurance";
    case "WorkspaceDefault":
      return "Workspace default";
    default: {
      const exhaustive: never = profile;
      return exhaustive;
    }
  }
}
