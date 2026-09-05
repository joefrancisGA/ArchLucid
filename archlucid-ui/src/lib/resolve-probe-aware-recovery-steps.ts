import type { WorkspaceAiAvailabilityCheckState } from "@/hooks/useWorkspaceAiAvailabilityCheck";
import { workspaceAiUnavailableDetail } from "@/lib/workspace-ai-availability";

export type ProbeAwareRecoveryStepsInput = {
  readonly baseSteps: readonly string[];
  readonly probeState: WorkspaceAiAvailabilityCheckState;
  readonly usesCustomerAiConnection: boolean;
  readonly canConfigureWorkspaceAi: boolean;
  /** When true, the review failed for a reason other than live AI unavailability. */
  readonly reviewTerminalFailure?: boolean;
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
  // AI availability panel and the Re-run CTA already state the outcome — no numbered list.
  return [];
}

function probePendingSteps(): readonly string[] {
  return [
    "Checking live AI availability automatically for this session…",
    "Do not assume platform AI is down until the live probe finishes.",
    "When the live probe succeeds, click Re-run review to retry with the same intake.",
  ];
}

function probeErrorSteps(): readonly string[] {
  return [
    "Automatic AI availability checks could not finish. Use Check AI availability below to retry the live probe.",
    "Do not assume platform AI is down until a live probe confirms an outage.",
    "When the live probe succeeds, click Re-run review to retry with the same intake.",
  ];
}

/**
 * Replaces static infrastructure recovery steps once a live probe has a definitive result.
 * Outage claims appear only after the probe reports unavailability.
 */
export function resolveProbeAwareRecoverySteps(input: ProbeAwareRecoveryStepsInput): readonly string[] {
  const { probeState, usesCustomerAiConnection, canConfigureWorkspaceAi } = input;

  if (probeState.status === "idle" || probeState.status === "loading") {
    return probePendingSteps();
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
