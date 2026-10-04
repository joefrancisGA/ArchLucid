import {
  DEFAULT_SEMANTIC_REJECT_BELOW,
  DEFAULT_SEMANTIC_WARN_BELOW,
  DEFAULT_STRUCTURAL_REJECT_BELOW,
  DEFAULT_STRUCTURAL_WARN_BELOW,
  type AgentQualityConcernStatus,
} from "@/lib/agent-quality-warnings-presenter";

export type AgentQualityRatioKind = "structural" | "semantic" | "faithfulness";

const NOT_SCORED_LABEL = "Not scored";

export function formatAgentQualityRatioCell(
  value: number | null,
  kind: AgentQualityRatioKind,
  status: AgentQualityConcernStatus,
): string {
  if (value === null || Number.isNaN(value)) {
    return NOT_SCORED_LABEL;
  }

  if (value > 1) {
    return "Not usable";
  }

  return value.toFixed(2);
}

/** Hint when a persisted ratio is outside the expected 0–1 range (UU-510). */
export function agentQualityRatioOutOfRangeHint(value: number | null): string | null {
  if (value === null || Number.isNaN(value) || value <= 1) {
    return null;
  }

  return `Recorded value ${value.toFixed(2)} is outside the expected 0–1 range`;
}

/** Display-only floor hint when a ratio is below the mirrored server gate (UU-405). */
export function agentQualityRatioFloorHint(
  value: number | null,
  kind: AgentQualityRatioKind,
  status: AgentQualityConcernStatus,
): string | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  if (kind === "structural") {
    const floor = status === "rejected" ? DEFAULT_STRUCTURAL_REJECT_BELOW : DEFAULT_STRUCTURAL_WARN_BELOW;

    if (value < floor) {
      return `Below ${status === "rejected" ? "reject" : "warn"} floor ${floor}`;
    }

    return null;
  }

  if (kind === "semantic") {
    const floor = status === "rejected" ? DEFAULT_SEMANTIC_REJECT_BELOW : DEFAULT_SEMANTIC_WARN_BELOW;

    if (value < floor) {
      return `Below ${status === "rejected" ? "reject" : "warn"} floor ${floor}`;
    }

    return null;
  }

  return null;
}

export { NOT_SCORED_LABEL as AGENT_QUALITY_NOT_SCORED_LABEL };
