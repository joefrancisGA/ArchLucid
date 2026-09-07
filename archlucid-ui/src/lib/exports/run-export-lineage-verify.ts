import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type RunExportLineageVerificationStatus = "Match" | "Mismatch" | "NotAttested";

export type RunExportLineageVerificationResult = {
  readonly status: RunExportLineageVerificationStatus;
  readonly runId: string;
  readonly detail?: string | null;
};

function buildVerifyPath(runId: string): string {
  const trimmed = runId.trim();

  return `/api/proxy/v1/artifacts/runs/${encodeURIComponent(trimmed)}/export/verify`;
}

/** Calls GET /v1/artifacts/runs/{runId}/export/verify (ADR 0040 / TB-307). */
export async function verifyRunExportLineage(runId: string): Promise<RunExportLineageVerificationResult> {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    throw new Error("runId is required for export lineage verify.");
  }

  const response = await fetch(
    buildVerifyPath(trimmed),
    mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text.length > 0 ? text : `Export verify failed (HTTP ${response.status}).`);
  }

  const body = (await response.json()) as {
    status?: string;
    runId?: string;
    detail?: string | null;
  };

  const status = body.status?.trim() ?? "NotAttested";

  return {
    status: status as RunExportLineageVerificationStatus,
    runId: body.runId?.trim() ?? trimmed,
    detail: body.detail ?? null,
  };
}

/** DR-10: Match is the attested success path (prompt "Attested" = API Match). */
export function isRunExportLineageAttested(result: RunExportLineageVerificationResult): boolean {
  return result.status === "Match";
}

export function formatRunExportLineageStatusLabel(
  result: RunExportLineageVerificationResult,
): "Attested" | "Not attested" {
  return isRunExportLineageAttested(result) ? "Attested" : "Not attested";
}

/** Returns the first non-attested verify result, or null when every run attests. */
export async function findFirstNonAttestedRunExportLineage(
  runIds: readonly string[],
): Promise<RunExportLineageVerificationResult | null> {
  for (const runId of runIds) {
    const trimmed = runId.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const result = await verifyRunExportLineage(trimmed);

    if (!isRunExportLineageAttested(result)) {
      return result;
    }
  }

  return null;
}
