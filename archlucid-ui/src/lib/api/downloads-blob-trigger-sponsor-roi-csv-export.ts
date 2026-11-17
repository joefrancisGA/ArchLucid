import { ApiV1Routes } from "@/lib/api-v1-routes";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { sponsorRoiCsvExportMutationBlockedReason } from "@/lib/pilots/sponsor-roi-csv-export-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { applyCorrelationHeaders } from "@/lib/api/http";
import { triggerBrowserBlobDownload } from "@/lib/api/downloads-blob-trigger-browser";
import { getSponsorRoiCsvExportUrl } from "@/lib/api/downloads-blob-urls";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export const SPONSOR_ROI_CSV_HEADER =
  "Finding,Review,System,Environment,Category,Severity,Title,Affected resource,Estimated USD savings" as const;

function formatSponsorRoiCsvCell(
  value: string | null | undefined,
  notStoredLabel: string,
  storedEmptyLabel: string,
): string {
  if (value === null || value === undefined) {
    return notStoredLabel;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return storedEmptyLabel;
  }

  return trimmed;
}

function formatSponsorRoiCsvOptionalNumber(
  value: number | null | undefined,
  notStoredLabel: string,
): string {
  if (value === null || value === undefined) {
    return notStoredLabel;
  }

  return String(value);
}

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
  savingsPricingBasis?: string | null;
  eaDiscountMultiplier?: number | null;
  savingsPricingBasisDescription?: string;
  costEvidenceFreshnessStatus?: string;
};

export function formatSponsorRoiCsvCostEvidenceFreshnessLine(
  status: string | null | undefined,
): string {
  if (status === null || status === undefined) {
    return "Cost evidence freshness was not stored.";
  }

  const trimmed = status.trim();

  if (trimmed.length === 0) {
    return "Cost evidence freshness was stored empty.";
  }

  return `Cost evidence freshness: ${trimmed}`;
}

export function formatSponsorRoiCsvPreamble(json: SponsorRoiExportPayload): string {
  const pricingBasis = json.savingsPricingBasis?.trim() || "Pricing basis was not stored.";
  const eaMultiplierLabel =
    json.eaDiscountMultiplier === null || json.eaDiscountMultiplier === undefined
      ? "EA discount multiplier was not stored."
      : `EA discount multiplier ${json.eaDiscountMultiplier}`;

  return [
    `# Savings pricing basis: ${pricingBasis} (${eaMultiplierLabel})`,
    json.savingsPricingBasisDescription ? `# ${json.savingsPricingBasisDescription}` : null,
    `# ${formatSponsorRoiCsvCostEvidenceFreshnessLine(json.costEvidenceFreshnessStatus)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

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
    const blockedReason = sponsorRoiCsvExportMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

  const json = (await response.json()) as SponsorRoiExportPayload;
  const preamble = formatSponsorRoiCsvPreamble(json);
  const lines = (json.rows ?? []).map((row) =>
    [
      formatSponsorRoiCsvCell(row.findingId, "Finding id was not stored.", "Finding id was stored empty."),
      formatSponsorRoiCsvCell(row.runId, "Review id was not stored.", "Review id was stored empty."),
      formatSponsorRoiCsvCell(row.systemName, "System name was not stored.", "System name was stored empty."),
      formatSponsorRoiCsvCell(row.environment, "Environment was not stored.", "Environment was stored empty."),
      formatSponsorRoiCsvCell(row.category, "Category was not stored.", "Category was stored empty."),
      formatSponsorRoiCsvCell(row.severity, "Severity was not stored.", "Severity was stored empty."),
      `"${formatSponsorRoiCsvCell(row.title, "Finding title was not stored.", "Finding title was stored empty.").replaceAll('"', '""')}"`,
      formatSponsorRoiCsvCell(
        row.affectedResource,
        "Affected resource was not stored.",
        "Affected resource was stored empty.",
      ),
      formatSponsorRoiCsvOptionalNumber(row.estimatedUsdSavings, "Estimated USD savings was not stored."),
    ].join(","),
  );

  const blob = new Blob([[preamble, SPONSOR_ROI_CSV_HEADER, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  await triggerBrowserBlobDownload(blob, "sponsor-roi-findings.csv");
}

/** Canonical API path segment for sponsor ROI CSV export JSON (tests / drift guards). */
export const SPONSOR_ROI_CSV_EXPORT_API_PATH = `/api/proxy/${ApiV1Routes.roiSponsorReport}/export`;
