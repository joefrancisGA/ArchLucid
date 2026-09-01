import type { WorkspaceAiAvailabilityCheckState } from "@/hooks/useWorkspaceAiAvailabilityCheck";
import { workspaceAiUnavailableDetail } from "@/lib/workspace-ai-availability";

export type ProbeAwareRecoveryStepsInput = {
  readonly baseSteps: readonly string[];
  readonly probeState: WorkspaceAiAvailabilityCheckState;
  readonly usesCustomerAiConnection: boolean;
  readonly canConfigureWorkspaceAi: boolean;
};

function managedPlatformOutageSteps(canConfigureWorkspaceAi: boolean): readonly string[] {
  if (canConfigureWorkspaceAi) {
    return [
      "The live AI availability probe reports that ArchLucid-managed AI is unavailable right now — changing models on Administration → AI models will not fix a platform outage.",
      "Open Report a problem and include this review id so support can investigate.",
      "Return here and click Re-run review after the live probe succeeds.",
    ];
  }

  return [
    "The live AI availability probe reports that ArchLucid-managed AI is unavailable right now.",
    "Share the administrator handoff below with a workspace administrator so support can investigate.",
    "Return here and click Re-run review after the live probe succeeds.",
  ];
}

function customerConnectionOutageSteps(canConfigureWorkspaceAi: boolean): readonly string[] {
  if (canConfigureWorkspaceAi) {
    return [
      "The live AI availability probe reports that your workspace customer-provided AI connection is unavailable.",
      "Contact your ArchLucid support contact with this review id — connection credentials are managed outside this workspace UI.",
      "Return here and click Re-run review after the live probe succeeds.",
    ];
  }

  return [
    "The live AI availability probe reports that your workspace customer-provided AI connection is unavailable.",
    "Share the administrator handoff below with a workspace administrator.",
    "Return here and click Re-run review after the live probe succeeds.",
  ];
}

function probeSucceededSteps(): readonly string[] {
  return [
    "The live AI availability probe succeeded — platform AI is ready for this session.",
    "Click Re-run review to retry the assessment with the same intake.",
  ];
}

function probePendingSteps(baseSteps: readonly string[]): readonly string[] {
  return baseSteps;
}

function probeErrorSteps(): readonly string[] {
  return [
    "Could not validate AI availability automatically. Use Check AI availability below to retry the live probe.",
    "Do not assume platform AI is down until a live probe confirms an outage.",
    "When the live probe succeeds, click Re-run review to retry with the same intake.",
  ];
}

/**
 * Replaces static infrastructure recovery steps once a live probe has a definitive result.
 * Outage claims appear only after the probe reports unavailability.
 */
export function resolveProbeAwareRecoverySteps(input: ProbeAwareRecoveryStepsInput): readonly string[] {
  const { baseSteps, probeState, usesCustomerAiConnection, canConfigureWorkspaceAi } = input;

  if (probeState.status === "idle" || probeState.status === "loading") {
    return probePendingSteps(baseSteps);
  }

  if (probeState.status === "error") {
    return probeErrorSteps();
  }

  if (probeState.result.isAvailable) {
    return probeSucceededSteps();
  }

  const outageDetail = workspaceAiUnavailableDetail(probeState.result).trim();

  if (outageDetail.length > 0) {
    const outageSteps = usesCustomerAiConnection
      ? customerConnectionOutageSteps(canConfigureWorkspaceAi)
      : managedPlatformOutageSteps(canConfigureWorkspaceAi);

    return [outageDetail, ...outageSteps.slice(1)];
  }

  return usesCustomerAiConnection
    ? customerConnectionOutageSteps(canConfigureWorkspaceAi)
    : managedPlatformOutageSteps(canConfigureWorkspaceAi);
}
