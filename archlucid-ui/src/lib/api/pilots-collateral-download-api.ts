import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

/** Downloads sponsor proof pack ZIP for a committed run (browser only). */
export async function downloadSponsorProofPackZip(runId: string): Promise<void> {
  await downloadScopedProxyFileGet(
    `/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/sponsor-proof-pack.zip`,
    {
      accept: "application/zip, application/json",
      defaultFileName: `sponsor-proof-pack-${runId}.zip`,
      expectedContentTypePrefixes: ["application/zip"],
    },
  );
}

/** Downloads sponsor review packet Markdown for a committed run (browser only). */
export async function downloadSponsorReviewPacketMarkdown(runId: string): Promise<void> {
  await downloadScopedProxyFileGet(
    `/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/sponsor-review-packet`,
    {
      accept: "text/markdown, application/json",
      defaultFileName: `archlucid-sponsor-review-packet-${runId}.md`,
    },
  );
}

/** Downloads first-value report Markdown for a committed run (browser only). */
export async function downloadPilotFirstValueReportMarkdown(runId: string): Promise<void> {
  await downloadScopedProxyFileGet(
    `/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/first-value-report`,
    {
      accept: "text/markdown, application/json",
      defaultFileName: `archlucid-first-value-report-${runId}.md`,
    },
  );
}
