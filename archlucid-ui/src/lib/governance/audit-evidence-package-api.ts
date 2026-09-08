import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { formatAuditEvidenceSealedManifestAwareApiError } from "@/lib/governance/audit-evidence-sealed-manifest-conflict";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { applyCorrelationHeaders } from "@/lib/api/http";

/** Downloads audit evidence package ZIP for an assessment snapshot. */
export async function downloadAuditEvidencePackageZip(
  assessmentId: string,
  snapshotId: string,
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("downloadAuditEvidencePackageZip is only supported in the browser.");
  }

  const path = `/api/proxy/v1/infra-evidence/audit-assessments/${encodeURIComponent(assessmentId)}/snapshots/${encodeURIComponent(snapshotId)}/evidence-package.zip`;
  const scoped = mergeRegistrationScopeForProxy({
    headers: { Accept: "application/zip, application/json" },
    credentials: "include",
    cache: "no-store",
  });
  const { headers: correlatedHeaders, correlationId } = applyCorrelationHeaders(new Headers(scoped.headers));
  const response = await fetch(path, { ...scoped, headers: correlatedHeaders });

  if (!response.ok) {
    const text = await response.text();
    const failure = toApiLoadFailure(buildApiRequestErrorFromParts(response, text, correlationId));
    throw new Error(formatAuditEvidenceSealedManifestAwareApiError(failure));
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `audit-evidence-${snapshotId}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatAuditEvidencePackageApiError(error: unknown): string {
  return formatAuditEvidenceSealedManifestAwareApiError(error);
}
