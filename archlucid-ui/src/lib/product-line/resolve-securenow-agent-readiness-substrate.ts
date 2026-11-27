import type { AgentExecutionModeWire } from "@/lib/agent-execution-mode";
import { isSimulatorAgentExecutionMode } from "@/lib/agent-execution-mode";
import { SECURENOW_AGENT_READINESS_NOT_AUTONOMOUS_LINE } from "@/lib/product-line/securenow-agent-readiness-substrate-copy";
import { SECURENOW_PATH_INSPECT_CITATION_ALLOWED_REFS_LEAD } from "@/lib/product-line/securenow-path-inspect-citation-allowed-copy";
import {
  SECURENOW_PATH_INSPECT_EXPLANATION_MODEL_LEAD,
  SECURENOW_PATH_INSPECT_EXPLANATION_SIMULATOR_LEAD,
  SECURENOW_PATH_INSPECT_RANK_MODE_DISCIPLINE,
} from "@/lib/product-line/securenow-path-inspect-copy";

export type SecureNowAgentReadinessSubstrate = {
  readonly modeLabel: string;
  readonly explanationLead: string;
  readonly rankDisciplineLine: string;
  readonly citationLine: string;
  readonly notAutonomousLine: string;
};

export function resolveSecureNowAgentReadinessSubstrate(
  mode: AgentExecutionModeWire | null,
): SecureNowAgentReadinessSubstrate | null {
  if (mode === null) {
    return null;
  }

  const simulator = isSimulatorAgentExecutionMode(mode);

  return {
    modeLabel: simulator ? "Simulator agent mode" : "Real agent mode",
    explanationLead: simulator
      ? SECURENOW_PATH_INSPECT_EXPLANATION_SIMULATOR_LEAD
      : SECURENOW_PATH_INSPECT_EXPLANATION_MODEL_LEAD,
    rankDisciplineLine: SECURENOW_PATH_INSPECT_RANK_MODE_DISCIPLINE,
    citationLine: SECURENOW_PATH_INSPECT_CITATION_ALLOWED_REFS_LEAD,
    notAutonomousLine: SECURENOW_AGENT_READINESS_NOT_AUTONOMOUS_LINE,
  };
}
