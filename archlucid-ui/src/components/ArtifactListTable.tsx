import Link from "next/link";

import { FunnelTelemetryExportAnchor } from "@/components/FunnelTelemetryExportAnchor";
import { ProductLearningFeedbackControls } from "@/components/ProductLearningFeedbackControls";
import type { ArtifactDescriptor } from "@/types/authority";
import { getArtifactDownloadUrl } from "@/lib/api";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  getArtifactBusinessLabel,
  getArtifactFormatLabel,
  sponsorArtifactAudienceLine,
  sponsorArtifactSecondaryCaption,
} from "@/lib/artifact-review-helpers";

/** Formats an ISO 8601 date string for display, falling back to the raw string on failure. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * Builds the Preview link URL: run-scoped (/runs/{runId}/artifacts/...) when runId is provided
 * (redirects to manifest canonical), otherwise manifest-scoped (/manifests/{manifestId}/artifacts/...).
 */
function reviewHrefForArtifact(
  manifestId: string,
  artifactId: string,
  runId: string | undefined,
): string {
  if (runId) {
    return `/reviews/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(artifactId)}`;
  }

  return `/manifests/${encodeURIComponent(manifestId)}/artifacts/${encodeURIComponent(artifactId)}`;
}

/**
 * Deterministic artifact list for run and manifest pages (preview + download).
 */
export function ArtifactListTable(props: {
  manifestId: string;
  artifacts: ArtifactDescriptor[];
  /** When set, the matching row is visually emphasized (e.g. on artifact preview page). */
  currentArtifactId?: string;
  /**
   * When set, Preview links use /runs/.../artifacts/... (redirects to manifest-scoped preview).
   * Improves run-centric navigation from run detail.
   */
  runId?: string;
  /** Buyer/demo manifest: omit the Format column (MIME-ish values stay out of sponsor-first tables). */
  sponsorMode?: boolean;
}) {
  const { manifestId, artifacts, currentArtifactId, runId, sponsorMode } = props;
  const sorted = [...artifacts].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const hidePilotFeedbackOnArtifacts = isBuyerPolishedOperatorShellEnv();
  const artifactColumnLabel = sponsorMode ? "Output" : "Artifact";
  const previewLinkLabel = sponsorMode ? "View" : "Preview";
  const createdColumnLabel = sponsorMode ? "Generated" : "Created";

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-300 text-left dark:border-neutral-600">
            <th className="px-2 py-2.5">{artifactColumnLabel}</th>
            {sponsorMode ? null : <th className="px-2 py-2.5">Format</th>}
            <th className="px-2 py-2.5">{createdColumnLabel}</th>
            <th className="px-2 py-2.5">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((artifact) => {
            const reviewHref = reviewHrefForArtifact(manifestId, artifact.artifactId, runId);
            const businessLabel = getArtifactBusinessLabel(artifact.artifactType);
            const sponsorAudience =
              sponsorMode === true ? sponsorArtifactAudienceLine(artifact.artifactType) : null;
            const sponsorCaption =
              sponsorMode === true ? sponsorArtifactSecondaryCaption(artifact.name, businessLabel) : null;

            const isCurrent =
              currentArtifactId !== undefined && currentArtifactId === artifact.artifactId;

            return (
              <tr
                key={artifact.artifactId}
                className={`border-b border-neutral-100 dark:border-neutral-800 ${isCurrent ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}
                title={sponsorMode ? undefined : `Content hash: ${artifact.contentHash}`}
              >
                <td className="max-w-[280px] px-2 py-2.5">
                  <strong className="font-semibold">{businessLabel}</strong>
                  {sponsorMode ? (
                    sponsorAudience !== null ? (
                      <p className="m-0 mt-1 text-[11px] text-neutral-700 dark:text-neutral-300">{sponsorAudience}</p>
                    ) : null
                  ) : null}
                  {sponsorMode ? (
                    sponsorCaption !== null ? (
                      <p className="m-0 mt-1 text-[11px] text-neutral-600 dark:text-neutral-400">{sponsorCaption}</p>
                    ) : null
                  ) : null}
                </td>
                {sponsorMode ? null : (
                  <td className="px-2 py-2.5 text-neutral-600 dark:text-neutral-400">
                    <span title={getArtifactFormatLabel(artifact.format)} className="text-xs">
                      {getArtifactFormatLabel(artifact.format)}
                    </span>
                  </td>
                )}
                <td className="whitespace-nowrap px-2 py-2.5 text-neutral-600 dark:text-neutral-400">
                  {formatDate(artifact.createdUtc)}
                </td>
                <td className="px-2 py-2.5">
                  <Link href={reviewHref}>{previewLinkLabel}</Link>
                  <span className="mx-2 text-neutral-300 dark:text-neutral-600">|</span>
                  <FunnelTelemetryExportAnchor href={getArtifactDownloadUrl(manifestId, artifact.artifactId)}>
                    Download
                  </FunnelTelemetryExportAnchor>
                  {runId && !hidePilotFeedbackOnArtifacts ? (
                    <div className="mt-2 max-w-xs">
                      <ProductLearningFeedbackControls
                        runId={runId}
                        subjectType="ManifestArtifact"
                        artifactHint={`${artifact.artifactType}:${artifact.name}`}
                        patternKey={`artifact:${artifact.artifactType}`}
                        detail={{
                          artifactId: artifact.artifactId,
                          manifestId,
                          format: artifact.format,
                        }}
                        compact
                        title="Artifact useful?"
                      />
                    </div>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sponsorMode && sorted.length > 0 ? (
        <details className="mt-4 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
          <summary className="cursor-pointer select-none text-sm font-medium text-neutral-800 dark:text-neutral-200">
            Technical appendix — format and fingerprints for all outputs
          </summary>
          <div className="mt-3 space-y-4">
            {sorted.map((artifact) => (
              <div
                key={`${artifact.artifactId}-tech`}
                className="border-t border-neutral-200 pt-3 first:border-t-0 first:pt-0 dark:border-neutral-700"
              >
                <p className="m-0 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {getArtifactBusinessLabel(artifact.artifactType)}
                </p>
                <dl className="m-0 mt-2 grid gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                  <div>
                    <dt className="m-0 font-medium text-neutral-700 dark:text-neutral-300">Media type / format</dt>
                    <dd className="m-0 mt-0.5">
                      <code className="break-all font-mono text-[10px] text-neutral-800 dark:text-neutral-200">
                        {artifact.format}
                      </code>
                      <span className="mt-1 block text-[10px] text-neutral-500 dark:text-neutral-500">
                        Presentation: {getArtifactFormatLabel(artifact.format)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="m-0 font-medium text-neutral-700 dark:text-neutral-300">Content fingerprint</dt>
                    <dd className="m-0 mt-0.5 break-all font-mono text-[10px] text-neutral-800 dark:text-neutral-200">
                      {artifact.contentHash}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
