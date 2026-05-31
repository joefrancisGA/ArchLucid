import Link from "next/link";

import { FunnelTelemetryExportAnchor } from "@/components/FunnelTelemetryExportAnchor";
import { ArtifactIntegrityTechnicalDetails } from "@/components/ArtifactIntegrityTechnicalDetails";
import { ProductLearningFeedbackControls } from "@/components/ProductLearningFeedbackControls";
import type { ArtifactDescriptor } from "@/types/authority";
import { getArtifactDownloadUrl } from "@/lib/api";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  getArtifactBusinessLabel,
  getArtifactDisplayLabel,
  getArtifactFormatLabel,
  sponsorArtifactAudienceBucket,
  sponsorArtifactAudienceLine,
  sponsorArtifactDownloadActionLabel,
  sponsorArtifactOpenActionLabel,
  sponsorArtifactSecondaryCaption,
  sponsorAudienceSectionHeading,
  sponsorAudienceSectionLead,
  type SponsorArtifactAudienceBucket,
} from "@/lib/artifact-review-helpers";

const AUDIENCE_BUCKET_ORDER: readonly SponsorArtifactAudienceBucket[] = [
  "sponsor",
  "shared",
  "architects",
  "audit",
  "other",
];

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
  /**
   * When true with {@link sponsorMode}, splits manifest-style lists into audience sections (manifest detail).
   */
  audienceSections?: boolean;
  /**
   * When set with {@link sponsorMode} and {@link audienceSections}, only these audience buckets are rendered
   * (preserves {@link AUDIENCE_BUCKET_ORDER} ordering).
   */
  deliverablesBucketAllowlist?: readonly SponsorArtifactAudienceBucket[];
  /** Omit the integrity appendix (e.g. when a parent renders it once below tabbed tables). */
  omitIntegrityDetails?: boolean;
}) {
  const {
    manifestId,
    artifacts,
    currentArtifactId,
    runId,
    sponsorMode,
    audienceSections = false,
    deliverablesBucketAllowlist,
    omitIntegrityDetails = false,
  } = props;
  const sorted = [...artifacts].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const hidePilotFeedbackOnArtifacts = isBuyerPolishedOperatorShellEnv();
  const audienceDeliverablesCardChrome =
    sponsorMode === true && audienceSections === true && hidePilotFeedbackOnArtifacts === true;
  const artifactColumnLabel = sponsorMode ? "Output" : "Artifact";
  const createdColumnLabel = sponsorMode ? "Generated" : "Created";

  const renderArtifactRows = (list: ArtifactDescriptor[]) =>
    list.map((artifact) => {
      const reviewHref = reviewHrefForArtifact(manifestId, artifact.artifactId, runId);
      const businessLabel =
        sponsorMode === true
          ? getArtifactDisplayLabel({ artifactId: artifact.artifactId, artifactType: artifact.artifactType })
          : getArtifactBusinessLabel(artifact.artifactType);
      const openActionLabel = sponsorMode ? sponsorArtifactOpenActionLabel(artifact.artifactType) : "Preview";
      const downloadActionLabel = sponsorMode ? sponsorArtifactDownloadActionLabel(artifact.artifactType) : "Download";
      const sponsorAudience =
        sponsorMode === true ? sponsorArtifactAudienceLine(artifact.artifactType) : null;
      const sponsorCaption =
        sponsorMode === true ? sponsorArtifactSecondaryCaption(artifact.name, businessLabel) : null;

      const isCurrent = currentArtifactId !== undefined && currentArtifactId === artifact.artifactId;

      return (
        <tr
          key={artifact.artifactId}
          className={`border-b border-neutral-100 dark:border-neutral-800 ${isCurrent ? "bg-[var(--al-layer-hover)] dark:bg-neutral-800/80" : ""}`}
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
            <Link href={reviewHref}>{openActionLabel}</Link>
            <span className="mx-2 text-neutral-300 dark:text-neutral-600">|</span>
            <FunnelTelemetryExportAnchor href={getArtifactDownloadUrl(manifestId, artifact.artifactId)}>
              {downloadActionLabel}
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
    });

  const thead = (
    <thead>
      <tr className="border-b border-neutral-300 text-left dark:border-neutral-600">
        <th className="px-2 py-2.5">{artifactColumnLabel}</th>
        {sponsorMode ? null : <th className="px-2 py-2.5">Format</th>}
        <th className="px-2 py-2.5">{createdColumnLabel}</th>
        <th className="px-2 py-2.5">Actions</th>
      </tr>
    </thead>
  );

  const integrityDetails =
    !omitIntegrityDetails && sponsorMode && sorted.length > 0 ? (
      <ArtifactIntegrityTechnicalDetails artifacts={sorted} />
    ) : null;

  if (sponsorMode === true && audienceSections === true) {
    const bucketSequence =
      deliverablesBucketAllowlist !== undefined
        ? AUDIENCE_BUCKET_ORDER.filter((b) => deliverablesBucketAllowlist.includes(b))
        : [...AUDIENCE_BUCKET_ORDER];

    return (
      <div className="overflow-x-auto">
        <div className="space-y-10" role="region" aria-label="Deliverables grouped by audience">
          {bucketSequence.map((bucket) => {
            const slice = sorted.filter((a) => sponsorArtifactAudienceBucket(a.artifactType) === bucket);

            if (slice.length === 0) {
              return null;
            }

            return (
              <section
                key={bucket}
                aria-labelledby={`artifact-audience-${bucket}`}
                className={
                  audienceDeliverablesCardChrome
                    ? "rounded-xl border border-neutral-200/90 bg-neutral-50/50 p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950/35 sm:p-4"
                    : undefined
                }
              >
                <h3
                  id={`artifact-audience-${bucket}`}
                  className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400"
                >
                  {sponsorAudienceSectionHeading(bucket)}
                </h3>
                <p className="m-0 mt-1 mb-3 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
                  {sponsorAudienceSectionLead(bucket)}
                </p>
                <table className="w-full border-collapse text-sm">
                  {thead}
                  <tbody>{renderArtifactRows(slice)}</tbody>
                </table>
              </section>
            );
          })}
        </div>
        {integrityDetails}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {thead}
        <tbody>{renderArtifactRows(sorted)}</tbody>
      </table>
      {!omitIntegrityDetails && sponsorMode && sorted.length > 0 ? (
        <ArtifactIntegrityTechnicalDetails artifacts={sorted} />
      ) : null}
    </div>
  );
}
