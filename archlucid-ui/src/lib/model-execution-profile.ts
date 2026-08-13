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

export type ModelExecutionProfileDescriptor = {
  readonly summary: string;
  readonly tradeoffs: readonly string[];
};

export function modelExecutionProfileDescriptor(profile: ModelExecutionProfile): ModelExecutionProfileDescriptor {
  switch (profile) {
    case "Economy":
      return {
        summary: "Lower token spend for routine architecture reviews.",
        tradeoffs: [
          "Uses economy model tiers across agent roles",
          "May reduce depth on complex governance decisions",
        ],
      };
    case "Balanced":
      return {
        summary: "Recommended default balance of cost and assurance.",
        tradeoffs: [
          "Standard model tiers for most review workloads",
          "Suitable starting point for new workspaces",
        ],
      };
    case "HighAssurance":
      return {
        summary: "Strongest model tiers for high-stakes governance reviews.",
        tradeoffs: [
          "Higher token spend per review",
          "May increase agent run latency on some tasks",
        ],
      };
    default: {
      const exhaustive: never = profile;
      return exhaustive;
    }
  }
}
