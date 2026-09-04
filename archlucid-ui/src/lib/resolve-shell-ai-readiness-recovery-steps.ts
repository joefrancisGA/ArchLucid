import type { SessionAiReadinessState } from "@/hooks/use-session-ai-readiness";
import { workspaceAiUnavailableDetail } from "@/lib/workspace-ai-availability";

function managedPlatformShellSteps(): readonly string[] {
  return [
    "Confirm ArchLucid.Api is running and reachable from this UI host.",
    "Configure Azure OpenAI on the API host (endpoint, deployment, API key or managed identity), or switch the top-bar chip back to rule-based analysis.",
    "Press Check AI availability to re-run the live probe after fixing configuration.",
  ];
}

function customerConnectionShellSteps(): readonly string[] {
  return [
    "Open Administration → AI models and verify your workspace customer-provided AI connection.",
    "Press Check AI availability to re-run the live probe after the connection is restored.",
    "Open Report a problem if the probe still fails after your connection is updated.",
  ];
}

function probePendingShellSteps(): readonly string[] {
  return [
    "Checking live AI availability for this session…",
    "Do not assume platform AI is down until the live probe finishes.",
  ];
}

function probeErrorShellSteps(): readonly string[] {
  return [
    "Automatic AI availability checks could not finish. Use Check AI availability to retry the live probe.",
    "If this persists after a retry, confirm the API is running and open Report a problem.",
  ];
}

/** Operator-shell recovery steps when Live AI mode is active but not ready. */
export function resolveShellAiReadinessRecoverySteps(
  readiness: SessionAiReadinessState,
): readonly string[] {
  if (!readiness.isSessionReal || readiness.isReady) {
    return [];
  }

  const { probeState, availability } = readiness;

  if (probeState.status === "idle" || probeState.status === "loading") {
    return probePendingShellSteps();
  }

  if (probeState.status === "error") {
    return probeErrorShellSteps();
  }

  if (probeState.result.isAvailable) {
    return [];
  }

  const outageDetail = workspaceAiUnavailableDetail(probeState.result).trim();
  const usesCustomerConnection = availability?.aiSource === "customer-connection";
  const baseSteps = usesCustomerConnection
    ? customerConnectionShellSteps()
    : managedPlatformShellSteps();

  if (outageDetail.length > 0) {
    return [outageDetail, ...baseSteps.slice(1)];
  }

  return baseSteps;
}
