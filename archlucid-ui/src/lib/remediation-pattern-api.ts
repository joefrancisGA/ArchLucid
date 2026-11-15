import type {
  RemediationPatternDetailResult,
  RemediationPatternImportResult,
  RemediationPatternOperationResult,
  RemediationPatternRecord,
  RemediationPatternVersionRecord,
} from "@/lib/remediation-pattern-types";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

async function proxyJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(
    `/api/proxy/${path}`,
    mergeRegistrationScopeForProxy({
      credentials: "include",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    }),
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

function mapText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function mapPatternRecord(raw: unknown): RemediationPatternRecord | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const patternId = mapText(row.patternId);

  return patternId.length === 0
    ? null
    : {
        patternId,
        patternKey: mapText(row.patternKey),
        displayName: mapText(row.displayName),
        description: typeof row.description === "string" ? row.description.trim() : null,
        currentApprovedVersion: typeof row.currentApprovedVersion === "string"
          ? row.currentApprovedVersion.trim()
          : null,
        createdByActorKey: mapText(row.createdByActorKey),
        createdUtc: mapText(row.createdUtc),
        updatedUtc: mapText(row.updatedUtc),
      };
}

function mapVersion(raw: unknown): RemediationPatternVersionRecord | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const versionId = mapText(row.versionId);

  return versionId.length === 0
    ? null
    : {
        versionId,
        patternId: mapText(row.patternId),
        version: mapText(row.version),
        status: typeof row.status === "number" || typeof row.status === "string" ? row.status as number : undefined,
        controlObjective: mapText(row.controlObjective),
        contentJson: typeof row.contentJson === "string" ? row.contentJson : null,
        authorActorKey: mapText(row.authorActorKey),
        approvedByActorKey: typeof row.approvedByActorKey === "string" ? row.approvedByActorKey.trim() : null,
        approvedUtc: typeof row.approvedUtc === "string" ? row.approvedUtc.trim() : null,
        automationLevel: typeof row.automationLevel === "number" || typeof row.automationLevel === "string"
          ? row.automationLevel
          : undefined,
        createdUtc: mapText(row.createdUtc),
        updatedUtc: mapText(row.updatedUtc),
      };
}

export async function fetchRemediationPatterns(): Promise<RemediationPatternRecord[]> {
  const raw = await proxyJson<unknown>("v1/operational-security/remediation-patterns");

  return Array.isArray(raw)
    ? raw.flatMap((item) => {
        const mapped = mapPatternRecord(item);

        return mapped === null ? [] : [mapped];
      })
    : [];
}

export async function fetchRemediationPatternDetail(patternId: string): Promise<RemediationPatternDetailResult> {
  const normalizedPatternId = patternId.trim();
  const raw = await proxyJson<unknown>(
    `v1/operational-security/remediation-patterns/${encodeURIComponent(normalizedPatternId)}`,
  );
  const row = raw !== null && typeof raw === "object" && !Array.isArray(raw)
    ? raw as Record<string, unknown>
    : {};

  return {
    succeeded: row.succeeded === true,
    pattern: mapPatternRecord(row.pattern),
    versions: Array.isArray(row.versions)
      ? row.versions.flatMap((item) => {
          const mapped = mapVersion(item);

          return mapped === null ? [] : [mapped];
        })
      : [],
    errorMessage: typeof row.errorMessage === "string" ? row.errorMessage.trim() : null,
  };
}

export async function submitRemediationPatternVersion(
  patternId: string,
  version: string,
): Promise<RemediationPatternOperationResult> {
  return proxyJson<RemediationPatternOperationResult>(
    `v1/operational-security/remediation-patterns/${encodeURIComponent(patternId.trim())}/submit`,
    { method: "POST", body: JSON.stringify({ version }) },
  );
}

export async function approveRemediationPatternVersion(
  patternId: string,
  version: string,
): Promise<RemediationPatternOperationResult> {
  return proxyJson<RemediationPatternOperationResult>(
    `v1/operational-security/remediation-patterns/${encodeURIComponent(patternId.trim())}/approve`,
    { method: "POST", body: JSON.stringify({ version }) },
  );
}

export async function importRemediationPatternYaml(yaml: string): Promise<RemediationPatternImportResult> {
  return proxyJson<RemediationPatternImportResult>(
    "v1/operational-security/remediation-patterns/import/yaml",
    { method: "POST", body: JSON.stringify({ yaml }) },
  );
}
