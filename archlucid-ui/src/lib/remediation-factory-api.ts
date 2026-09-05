import type {
  RemediationFactoryMetrics,
  RemediationPrioritizedFinding,
  RemediationPrioritizationExplanation,
} from "@/lib/remediation-factory-types";

async function proxyGet<T>(path: string): Promise<T> {
  const response = await fetch(`/api/proxy/${path}`, { credentials: "include" });

  if (!response.ok)
    throw new Error(`Request failed (${response.status})`);

  return (await response.json()) as T;
}

export async function fetchRemediationRankedFindings(): Promise<RemediationPrioritizedFinding[]> {
  return proxyGet<RemediationPrioritizedFinding[]>("v1/operational-security/remediation-prioritization/ranked");
}

export async function fetchRemediationFactoryMetrics(): Promise<RemediationFactoryMetrics> {
  return proxyGet<RemediationFactoryMetrics>("v1/operational-security/remediation-metrics");
}

export async function fetchRemediationScoreExplanation(
  findingId: string,
): Promise<RemediationPrioritizationExplanation> {
  return proxyGet<RemediationPrioritizationExplanation>(
    `v1/operational-security/remediation-prioritization/findings/${findingId}/score`,
  );
}

export async function fetchSuggestedWaveSizes(): Promise<number[]> {
  return proxyGet<number[]>("v1/operational-security/remediation-prioritization/suggested-wave-sizes");
}
