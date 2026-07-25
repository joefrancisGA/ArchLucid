import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";

import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
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
 * Builds the Preview link URL: run-scoped when runId is provided, otherwise manifest-scoped.
 */
function reviewHrefForArtifact(
  manifestId: string,
  artifactId: string,
  runId: string | undefined,
): string {
  if (runId) {
    return `/reviews/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(artifactId)}`;
  }

  return `/signed-records/${encodeURIComponent(manifestId)}/artifacts/${encodeURIComponent(artifactId)}`;
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

  const sponsorDeliverablesTable = sponsorMode === true;
  const tableClassName = cn(
    "w-full border-collapse",
    sponsorDeliverablesTable ? "table-fixed" : undefined,
    OPERATOR_TYPOGRAPHY.body,
  );
  const outputCellClassName = cn(
    "px-3 py-2.5 align-top",
    sponsorMode === true ? "min-w-0 w-[42%]" : "max-w-[280px]",
  );
  const createdCellClassName = cn(
    "whitespace-nowrap px-3 py-2.5 align-top text-neutral-600 dark:text-neutral-400",
    sponsorMode === true ? "w-[18%]" : undefined,
  );
  const actionsCellClassName = cn("px-3 py-2.5 align-top", sponsorMode === true ? "min-w-0 w-[40%]" : undefined);

  const thead = (
    <thead>
      <tr className="border-b border-neutral-300 text-left dark:border-neutral-600">
        <th className={cn("px-3 py-2.5", sponsorMode === true ? "w-[42%]" : undefined)}>{artifactColumnLabel}</th>
        {sponsorMode ? null : <th className="px-3 py-2.5">Format</th>}
        <th className={cn("px-3 py-2.5", sponsorMode === true ? "w-[18%]" : undefined)}>{createdColumnLabel}</th>
        <th className={cn("px-3 py-2.5", sponsorMode === true ? "w-[40%]" : undefined)}>Actions</th>
      </tr>
    </thead>
  );

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
          <td className={outputCellClassName}>
            <strong className="font-semibold">{businessLabel}</strong>
            {sponsorMode ? (
              sponsorAudience !== null ? (
                <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{sponsorAudience}</p>
              ) : null
            ) : null}
            {sponsorMode ? (
              sponsorCaption !== null ? (
                <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{sponsorCaption}</p>
              ) : null
            ) : null}
          </td>
          {sponsorMode ? null : (
            <td className="px-3 py-2.5 text-neutral-600 dark:text-neutral-400">
              <span title={getArtifactFormatLabel(artifact.format)} className={OPERATOR_TYPOGRAPHY.helper}>
                {getArtifactFormatLabel(artifact.format)}
              </span>
            </td>
          )}
          <td className={createdCellClassName}>
            {formatDate(artifact.createdUtc)}
          </td>
          <td className={actionsCellClassName}>
            <Link href={reviewHref} className={OPERATOR_LINK.nav}>
              {openActionLabel}
            </Link>
            <span className="mx-2 text-neutral-300 dark:text-neutral-600">|</span>
            <ExportTrackedAnchor href={getArtifactDownloadUrl(manifestId, artifact.artifactId)}>
              {downloadActionLabel}
            </ExportTrackedAnchor>
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
      <div className="w-full min-w-0 overflow-x-auto">
        <div className="w-full space-y-10" role="region" aria-label="Deliverables grouped by audience">
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
                  className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                >
                  {sponsorAudienceSectionHeading(bucket)}
                </h3>
                <p className={cn("m-0 mt-1 mb-3 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                  {sponsorAudienceSectionLead(bucket)}
                </p>
                <table className={tableClassName}>
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
    <div className="w-full min-w-0 overflow-x-auto">
      <table className={tableClassName}>
        {thead}
        <tbody>{renderArtifactRows(sorted)}</tbody>
      </table>
      {!omitIntegrityDetails && sponsorMode && sorted.length > 0 ? (
        <ArtifactIntegrityTechnicalDetails artifacts={sorted} />
      ) : null}
    </div>
  );
}
