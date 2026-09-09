import { ApiV1Routes } from "@/lib/api-v1-routes";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { applyCorrelationHeaders } from "@/lib/api/http";
import { triggerBrowserBlobDownload } from "@/lib/api/downloads-blob-trigger-browser";
import { getSponsorRoiCsvExportUrl } from "@/lib/api/downloads-blob-urls";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type SponsorRoiExportRow = {
  findingId: string;
  runId: string;
  systemName: string;
  environment: string;
  category: string;
  severity: string;
  title: string;
  affectedResource?: string | null;
  estimatedUsdSavings?: number | null;
};

type SponsorRoiExportPayload = {
  rows?: SponsorRoiExportRow[];
  savingsPricingBasis?: string;
  eaDiscountMultiplier?: number;
  savingsPricingBasisDescription?: string;
  costEvidenceFreshnessStatus?: string;
};

/** Downloads sponsor ROI findings CSV through the scoped proxy (browser only). */
export async function downloadSponsorRoiCsvExport(): Promise<void> {
  const scoped = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } });
  const { headers: correlatedHeaders, correlationId } = applyCorrelationHeaders(new Headers(scoped.headers));
  const response = await fetch(getSponsorRoiCsvExportUrl(), {
    ...scoped,
    headers: correlatedHeaders,
  });

  if (!response.ok) {
    const errText = await response.text();
    const failure = toApiLoadFailure(buildApiRequestErrorFromParts(response, errText, correlationId));
    throw new Error(formatExportSealedManifestAwareApiError(failure));
  }

  const json = (await response.json()) as SponsorRoiExportPayload;
  const eaMultiplier = json.eaDiscountMultiplier ?? 1;
  const preamble = [
    `# Savings pricing basis: ${json.savingsPricingBasis ?? "Retail"} (EA discount multiplier ${eaMultiplier})`,
    json.savingsPricingBasisDescription ? `# ${json.savingsPricingBasisDescription}` : null,
    json.costEvidenceFreshnessStatus ? `# Cost evidence freshness: ${json.costEvidenceFreshnessStatus}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  const header =
    "FindingId,RunId,SystemName,Environment,Category,Severity,Title,AffectedResource,EstimatedUsdSavings";
  const lines = (json.rows ?? []).map((row) =>
    [
      row.findingId,
      row.runId,
      row.systemName,
      row.environment,
      row.category,
      row.severity,
      `"${row.title.replaceAll('"', '""')}"`,
      row.affectedResource ?? "",
      row.estimatedUsdSavings ?? "",
    ].join(","),
  );

  const blob = new Blob([[preamble, header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  await triggerBrowserBlobDownload(blob, "sponsor-roi-findings.csv");
}

/** Canonical API path segment for sponsor ROI CSV export JSON (tests / drift guards). */
export const SPONSOR_ROI_CSV_EXPORT_API_PATH = `/api/proxy/${ApiV1Routes.roiSponsorReport}/export`;
