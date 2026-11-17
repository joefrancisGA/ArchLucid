export type RunPackageExportFormat = "docx" | "pdf" | "html";

/** Curated sample / static demo reviews have no backend-persisted export target. */
export const SAMPLE_REVIEW_EXPORT_UNAVAILABLE_HINT =
  "Downloads aren't available for this sample review. Start a review with your own input to export a package.";

function encodeTrimmedPathSegment(value: string): string {
  return encodeURIComponent(value.trim());
}

export function getArtifactDownloadUrl(manifestId: string, artifactId: string): string {
  return `/api/proxy/v1/artifacts/signed-review-records/${encodeTrimmedPathSegment(manifestId)}/artifact/${encodeTrimmedPathSegment(artifactId)}`;
}

/**
 * Finalized architecture-review-board package export (`RunsExportController`).
 * Prefer this over {@link getArtifactDownloadUrl} with the profile token — artifact routes require a GUID id.
 */
export function getRunPackageExportUrl(runId: string, format: RunPackageExportFormat): string {
  return `/api/proxy/v1/runs/${encodeTrimmedPathSegment(runId)}/export/${format}`;
}

/** Returns the proxy URL for downloading the full artifact bundle ZIP for a manifest. */
export function getBundleDownloadUrl(manifestId: string): string {
  return `/api/proxy/v1/artifacts/signed-review-records/${encodeTrimmedPathSegment(manifestId)}/bundle`;
}

/** Returns the proxy URL for the advisory Terraform placeholder export ZIP. */
export function getTerraformAdvisoryExportDownloadUrl(runId: string): string {
  return `/api/proxy/v1/artifacts/runs/${encodeTrimmedPathSegment(runId)}/terraform-advisory-export`;
}

/** Returns the proxy URL for downloading the full run export ZIP. */
export function getRunExportDownloadUrl(runId: string): string {
  return `/api/proxy/v1/artifacts/runs/${encodeTrimmedPathSegment(runId)}/export`;
}

/** Returns the proxy URL for the ADR 0052 decision receipt JSON on a committed infeasible run. */
export function getRunDecisionReceiptDownloadUrl(runId: string): string {
  return `/api/proxy/v1/artifacts/runs/${encodeTrimmedPathSegment(runId)}/decision-receipt`;
}

/** Returns the proxy URL for the ADR 0052 decision receipt JSON on a redirected intake draft. */
export function getDraftDecisionReceiptDownloadUrl(draftId: string): string {
  return `/api/proxy/v1/architecture/draft/${encodeTrimmedPathSegment(draftId)}/decision-receipt`;
}

/** Returns the proxy URL for the traceability ZIP (run summary + audit slice + decision traces, size-capped on API). */
export function getTraceabilityBundleDownloadUrl(runId: string): string {
  return `/api/proxy/v1/runs/${encodeTrimmedPathSegment(runId)}/review-trail/export`;
}

/** Returns the proxy URL for sponsor ROI findings export JSON (`GET /v1/roi/sponsor-report/export`). */
export function getSponsorRoiCsvExportUrl(): string {
  return `/api/proxy/v1/roi/sponsor-report/export`;
}

/** Returns the proxy URL for manifest compare markdown export file download. */
export function getManifestCompareExportDownloadUrl(leftVersion: string, rightVersion: string): string {
  const params = new URLSearchParams();
  const normalizedLeftVersion = leftVersion.trim();
  const normalizedRightVersion = rightVersion.trim();

  if (normalizedLeftVersion.length > 0) {
    params.set("leftVersion", normalizedLeftVersion);
  }

  if (normalizedRightVersion.length > 0) {
    params.set("rightVersion", normalizedRightVersion);
  }

  return `/api/proxy/v1/architecture/manifest/compare/export/file?${params.toString()}`;
}

/** Returns the proxy URL for the sponsor summary markdown export. */
export function getRunSummaryExportUrl(runId: string): string {
  return `/api/proxy/v1/architecture/run/${encodeTrimmedPathSegment(runId)}/export/summary`;
}

/** Returns the proxy URL for downloading the original ArchitectureRequest JSON. */
export function getArchitectureRequestDownloadUrl(requestId: string): string {
  return `/api/proxy/v1/architecture/request/${encodeTrimmedPathSegment(requestId)}`;
}

export type ConsultingDocxExportBrandingPayload = {
  reviewBoardWhitelabelFirmDisplayName?: string;
  reviewBoardWhitelabelClientEngagementTitle?: string;
  reviewBoardWhitelabelLogoBase64?: string | null;
};

/** DOCX package; optional compare + AI narrative flags. */
export function getArchitecturePackageDocxUrl(
  runId: string,
  compareWithRunId?: string,
  opts?: { explainRun?: boolean; includeComparisonExplanation?: boolean },
): string {
  const params = new URLSearchParams();
  if (compareWithRunId?.trim()) {
    params.set("compareWithRunId", compareWithRunId.trim());
  }

  if (opts?.explainRun) {
    params.set("explainRun", "true");
  }

  if (opts?.includeComparisonExplanation === false) {
    params.set("includeComparisonExplanation", "false");
  }

  const q = params.toString();
  const encodedRunId = encodeURIComponent(runId.trim());

  return `/api/proxy/v1/docx/runs/${encodedRunId}/architecture-package${q ? `?${q}` : ""}`;
}
