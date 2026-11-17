import { pilotsCollateralMutationBlockedReason } from "@/lib/pilots/pilots-collateral-mutation-blocked-reason";
import { trimRequiredPathSegment } from "./api-boundary-normalization";
import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

/** Builds the pilots collateral URL for a run that has already been trimmed and checked. */
function pilotRunCollateralUrl(normalizedRunId: string, resource: string): string {
  return `/api/proxy/v1/pilots/runs/${encodeURIComponent(normalizedRunId)}/${resource}`;
}

/** Downloads sponsor proof pack ZIP for a committed run (browser only). */
export async function downloadSponsorProofPackZip(runId: string): Promise<void> {
  // The same trimmed id is used for the URL and the default file name. A blank id throws here.
  const normalizedRunId = trimRequiredPathSegment(runId, "runId");

  await downloadScopedProxyFileGet(pilotRunCollateralUrl(normalizedRunId, "sponsor-proof-pack.zip"), {
    accept: "application/zip, application/json",
    defaultFileName: `sponsor-proof-pack-${normalizedRunId}.zip`,
    expectedContentTypePrefixes: ["application/zip"],
    resolveBlockedReason: pilotsCollateralMutationBlockedReason,
  });
}

/** Downloads sponsor review packet Markdown for a committed run (browser only). */
export async function downloadSponsorReviewPacketMarkdown(runId: string): Promise<void> {
  const normalizedRunId = trimRequiredPathSegment(runId, "runId");

  await downloadScopedProxyFileGet(pilotRunCollateralUrl(normalizedRunId, "sponsor-review-packet"), {
    accept: "text/markdown, application/json",
    defaultFileName: `archlucid-sponsor-review-packet-${normalizedRunId}.md`,
    resolveBlockedReason: pilotsCollateralMutationBlockedReason,
  });
}

/** Downloads first-value report Markdown for a committed run (browser only). */
export async function downloadPilotFirstValueReportMarkdown(runId: string): Promise<void> {
  const normalizedRunId = trimRequiredPathSegment(runId, "runId");

  await downloadScopedProxyFileGet(pilotRunCollateralUrl(normalizedRunId, "first-value-report"), {
    accept: "text/markdown, application/json",
    defaultFileName: `archlucid-first-value-report-${normalizedRunId}.md`,
    resolveBlockedReason: pilotsCollateralMutationBlockedReason,
  });
}
