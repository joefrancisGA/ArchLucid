import type { AgentExecutionModeWire } from "@/lib/agent-execution-mode";
import {
  resolveEffectiveWorkingCareerRehearsalDoor,
  type WorkingCareerDoorGateResult,
} from "@/lib/governance/working-career-door-gate";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";

export type ResolveWorkingSimulatorCloneRehearsalChromeInput = {
  readonly workingDesk: boolean;
  readonly guidedDesk: boolean;
  readonly hostMode: AgentExecutionModeWire | null;
  readonly sessionMode: AgentExecutionModeWire | null;
  readonly selectedDoor: WorkingCareerRehearsalDoorId;
  readonly careerExplicit: boolean;
  readonly careerGate: WorkingCareerDoorGateResult;
};

export type WorkingSimulatorCloneRehearsalChrome = {
  readonly hostPinnedSimulator: boolean;
  readonly showBanner: boolean;
  readonly effectiveDoor: WorkingCareerRehearsalDoorId;
  readonly careerBlockedHonesty: boolean;
};

/** Host is Simulator-pinned. A Real session override is not a grandfathered clone. */
export function isWorkingHostPinnedSimulator(
  hostMode: AgentExecutionModeWire | null,
  sessionMode: AgentExecutionModeWire | null,
): boolean {
  if (hostMode !== "Simulator") {
    return false;
  }

  return sessionMode !== "Real";
}

/**
 * CG-015: Simulator-pinned Working clones grandfather Rehearsal execute chrome.
 * Explicit Career stays AS-078 blocked-honesty (selected Career + blocked) and does not
 * auto-switch Guided. Overlay does not PUT the door or flip the host execution Mode default.
 */
export function resolveWorkingSimulatorCloneRehearsalChrome(
  input: ResolveWorkingSimulatorCloneRehearsalChromeInput,
): WorkingSimulatorCloneRehearsalChrome {
  const gatedEffectiveDoor = resolveEffectiveWorkingCareerRehearsalDoor(
    input.selectedDoor,
    input.careerGate,
  );
  const careerBlockedHonesty =
    input.selectedDoor === "career"
    && input.careerExplicit
    && input.careerGate.isCareerExecuteBlocked;
  const hostPinnedSimulator = isWorkingHostPinnedSimulator(input.hostMode, input.sessionMode);

  if (!input.workingDesk || input.guidedDesk) {
    return {
      hostPinnedSimulator,
      showBanner: false,
      effectiveDoor: gatedEffectiveDoor,
      careerBlockedHonesty: false,
    };
  }

  if (!hostPinnedSimulator) {
    return {
      hostPinnedSimulator: false,
      showBanner: false,
      effectiveDoor: gatedEffectiveDoor,
      careerBlockedHonesty,
    };
  }

  return {
    hostPinnedSimulator: true,
    showBanner: true,
    effectiveDoor: careerBlockedHonesty ? gatedEffectiveDoor : "rehearsal",
    careerBlockedHonesty,
  };
}
