import type { AgentExecutionModeWire } from "@/lib/agent-execution-mode";
import {
  WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL,
  WORKING_CAREER_DOOR_LIVE_AI_NOT_READY_BLOCKED_DETAIL,
  WORKING_CAREER_DOOR_LOADING_BLOCKED_DETAIL,
} from "@/lib/governance/working-career-door-gate-copy";

/** Engineering ratchet anchor — TB-1299 forbids silent Simulator as Career execute. */
export const WORKING_CAREER_DOOR_TB_1299_ANCHOR = "TB-1299";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";
import { CONNECTION_STATUS_CANONICAL_PATH } from "@/lib/connection-status-evidence-copy";

export type WorkingCareerDoorBlockReason =
  | "loading"
  | "host-simulator-pinned"
  | "live-ai-not-ready";

export type ResolveWorkingCareerDoorGateInput = {
  readonly selectedDoor: WorkingCareerRehearsalDoorId;
  readonly hostMode: AgentExecutionModeWire | null;
  readonly sessionMode: AgentExecutionModeWire | null;
  readonly isSessionReal: boolean;
  readonly isLiveAiReady: boolean;
  readonly isLoading: boolean;
};

export type WorkingCareerDoorGateResult = {
  readonly isCareerExecuteBlocked: boolean;
  readonly blockReason: WorkingCareerDoorBlockReason | null;
  readonly blockedDetail: string | null;
  readonly platformSettingsHref: string;
};

export const WORKING_CAREER_DOOR_PLATFORM_SETTINGS_HREF = CONNECTION_STATUS_CANONICAL_PATH;

/** Career door requires Real execute with live AI readiness (AS-078 / TB-1299). */
export function resolveWorkingCareerDoorGate(
  input: ResolveWorkingCareerDoorGateInput,
): WorkingCareerDoorGateResult {
  const platformSettingsHref = WORKING_CAREER_DOOR_PLATFORM_SETTINGS_HREF;

  if (input.selectedDoor !== "career") {
    return {
      isCareerExecuteBlocked: false,
      blockReason: null,
      blockedDetail: null,
      platformSettingsHref,
    };
  }

  if (input.isLoading) {
    return {
      isCareerExecuteBlocked: true,
      blockReason: "loading",
      blockedDetail: WORKING_CAREER_DOOR_LOADING_BLOCKED_DETAIL,
      platformSettingsHref,
    };
  }

  if (!input.isSessionReal) {
    const hostPinnedSimulator = input.hostMode === "Simulator" && input.sessionMode === "Simulator";

    return {
      isCareerExecuteBlocked: true,
      blockReason: hostPinnedSimulator ? "host-simulator-pinned" : "host-simulator-pinned",
      blockedDetail: WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL,
      platformSettingsHref,
    };
  }

  if (!input.isLiveAiReady) {
    return {
      isCareerExecuteBlocked: true,
      blockReason: "live-ai-not-ready",
      blockedDetail: WORKING_CAREER_DOOR_LIVE_AI_NOT_READY_BLOCKED_DETAIL,
      platformSettingsHref,
    };
  }

  return {
    isCareerExecuteBlocked: false,
    blockReason: null,
    blockedDetail: null,
    platformSettingsHref,
  };
}

/** Execute posture for downstream surfaces — blocked Career intent runs as Rehearsal. */
export function resolveEffectiveWorkingCareerRehearsalDoor(
  selectedDoor: WorkingCareerRehearsalDoorId,
  gate: WorkingCareerDoorGateResult,
): WorkingCareerRehearsalDoorId {
  if (selectedDoor === "career" && gate.isCareerExecuteBlocked) {
    return "rehearsal";
  }

  return selectedDoor;
}
