import type {
  RemediationPatternDetailResult,
  RemediationPatternImportResult,
  RemediationPatternOperationResult,
  RemediationPatternRecord,
} from "@/lib/remediation-pattern-types";

async function proxyJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/proxy/${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function fetchRemediationPatterns(): Promise<RemediationPatternRecord[]> {
  return proxyJson<RemediationPatternRecord[]>("v1/operational-security/remediation-patterns");
}

export async function fetchRemediationPatternDetail(patternId: string): Promise<RemediationPatternDetailResult> {
  return proxyJson<RemediationPatternDetailResult>(`v1/operational-security/remediation-patterns/${patternId}`);
}

export async function submitRemediationPatternVersion(
  patternId: string,
  version: string,
): Promise<RemediationPatternOperationResult> {
  return proxyJson<RemediationPatternOperationResult>(
    `v1/operational-security/remediation-patterns/${patternId}/submit`,
    { method: "POST", body: JSON.stringify({ version }) },
  );
}

export async function approveRemediationPatternVersion(
  patternId: string,
  version: string,
): Promise<RemediationPatternOperationResult> {
  return proxyJson<RemediationPatternOperationResult>(
    `v1/operational-security/remediation-patterns/${patternId}/approve`,
    { method: "POST", body: JSON.stringify({ version }) },
  );
}

export async function importRemediationPatternYaml(yaml: string): Promise<RemediationPatternImportResult> {
  return proxyJson<RemediationPatternImportResult>(
    "v1/operational-security/remediation-patterns/import/yaml",
    { method: "POST", body: JSON.stringify({ yaml }) },
  );
}
