import type { AgentExecutionModeWire } from "@/lib/agent-execution-mode";
import { isSimulatorAgentExecutionMode } from "@/lib/agent-execution-mode";
import {
  SECURENOW_CUTTING_EDGE_ASK_BOUNDED_LINE,
  SECURENOW_CUTTING_EDGE_NOT_FRONTIER_LINE,
} from "@/lib/product-line/securenow-cutting-edge-substrate-copy";
import {
  SECURENOW_PATH_INSPECT_EXPLANATION_REAL_MODE_LINE,
  SECURENOW_PATH_INSPECT_EXPLANATION_SIMULATOR_CONFIG_LINE,
  SECURENOW_PATH_INSPECT_RANK_MODE_DISCIPLINE,
  SECURENOW_PATH_INSPECT_RANK_STORED_PATH_DISCIPLINE,
} from "@/lib/product-line/securenow-path-inspect-copy";

export type SecureNowCuttingEdgeSubstrate = {
  readonly substrateLabel: string;
  readonly rankDisciplineLine: string;
  readonly storedPathLine: string;
  readonly explanationSubstrateLine: string;
  readonly askBoundedLine: string;
  readonly notFrontierLine: string;
};

export function resolveSecureNowCuttingEdgeSubstrate(
  mode: AgentExecutionModeWire | null,
): SecureNowCuttingEdgeSubstrate | null {
  if (mode === null) {
    return null;
  }

  const simulator = isSimulatorAgentExecutionMode(mode);

  return {
    substrateLabel: simulator ? "Stored rank + simulator substrate" : "Stored rank + Real model substrate",
    rankDisciplineLine: SECURENOW_PATH_INSPECT_RANK_MODE_DISCIPLINE,
    storedPathLine: SECURENOW_PATH_INSPECT_RANK_STORED_PATH_DISCIPLINE,
    explanationSubstrateLine: simulator
      ? SECURENOW_PATH_INSPECT_EXPLANATION_SIMULATOR_CONFIG_LINE
      : SECURENOW_PATH_INSPECT_EXPLANATION_REAL_MODE_LINE,
    askBoundedLine: SECURENOW_CUTTING_EDGE_ASK_BOUNDED_LINE,
    notFrontierLine: SECURENOW_CUTTING_EDGE_NOT_FRONTIER_LINE,
  };
}
