import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";

import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { ArtifactIntegrityTechnicalDetails } from "@/components/ArtifactIntegrityTechnicalDetails";
import { ProductLearningFeedbackControls } from "@/components/ProductLearningFeedbackControls";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import type { ArtifactDescriptor } from "@/types/authority";
import { getArtifactDownloadUrl } from "@/lib/api";
import { artifactPreviewHref } from "@/lib/artifact-preview-href";
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
 * Deterministic artifact list for run and manifest pages (preview + download).
 */
export function ArtifactListTable(props: {
  manifestId: string;
  artifacts: ArtifactDescriptor[];
  /** When set, the matching row is visually emphasized (e.g. on artifact preview page). */
  currentArtifactId?: string;
  /**
   * When set, Preview links use run-scoped artifact Preview (redirects to signed-record preview).
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
  /** When set with audience sections, renders bucket headings at this level under parent deliverables h3. */
  audienceHeadingLevel?: 3 | 4;
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
    audienceHeadingLevel = 3,
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
    <EnterpriseTableHead>
      <EnterpriseTableHeadRow className="border-b border-neutral-300 text-left dark:border-neutral-600">
        <EnterpriseTableHeaderCell scope="col" className={cn("px-3 py-2.5", sponsorMode === true ? "w-[42%]" : undefined)}>{artifactColumnLabel}</EnterpriseTableHeaderCell>
        {sponsorMode ? null : <EnterpriseTableHeaderCell scope="col" className="px-3 py-2.5">Format</EnterpriseTableHeaderCell>}
        <EnterpriseTableHeaderCell scope="col" className={cn("px-3 py-2.5", sponsorMode === true ? "w-[18%]" : undefined)}>{createdColumnLabel}</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell scope="col" className={cn("px-3 py-2.5", sponsorMode === true ? "w-[40%]" : undefined)}>Actions</EnterpriseTableHeaderCell>
      </EnterpriseTableHeadRow>
    </EnterpriseTableHead>
  );

  const renderArtifactRows = (list: ArtifactDescriptor[]) =>
    list.map((artifact) => {
      const reviewHref = artifactPreviewHref(manifestId, artifact.artifactId, runId);
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
        <EnterpriseTableRow
          key={artifact.artifactId}
          className={isCurrent ? "bg-[var(--al-layer-hover)] dark:bg-neutral-800/80" : undefined}
        >
          <EnterpriseTableCell className={outputCellClassName}>
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
          </EnterpriseTableCell>
          {sponsorMode ? null : (
            <EnterpriseTableCell className="px-3 py-2.5 text-neutral-600 dark:text-neutral-400">
              <span className={OPERATOR_TYPOGRAPHY.helper}>
                {getArtifactFormatLabel(artifact.format)}
              </span>
            </EnterpriseTableCell>
          )}
          <EnterpriseTableCell className={createdCellClassName}>
            {formatDate(artifact.createdUtc)}
          </EnterpriseTableCell>
          <EnterpriseTableCell className={actionsCellClassName}>
            <Link href={reviewHref} className={OPERATOR_LINK.nav}>
              {openActionLabel}
            </Link>
            <span className="mx-2 text-neutral-300 dark:text-neutral-600" aria-hidden="true">
              |
            </span>
            {/* Same affordance as the Open link — a download rendered as plain text reads as disabled. */}
            <ExportTrackedAnchor
              className={OPERATOR_LINK.nav}
              href={getArtifactDownloadUrl(manifestId, artifact.artifactId)}
            >
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
          </EnterpriseTableCell>
        </EnterpriseTableRow>
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
        <div className="w-full space-y-4" role="region" aria-label="Deliverables grouped by audience">
          {bucketSequence.map((bucket) => {
            const slice = sorted.filter((a) => sponsorArtifactAudienceBucket(a.artifactType) === bucket);

            if (slice.length === 0) {
              return null;
            }

            const AudienceHeadingTag = audienceHeadingLevel === 4 ? "h4" : "h3";

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
                <AudienceHeadingTag
                  id={`artifact-audience-${bucket}`}
                  className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                >
                  {sponsorAudienceSectionHeading(bucket)}
                </AudienceHeadingTag>
                <p className={cn("m-0 mt-1 mb-3 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                  {sponsorAudienceSectionLead(bucket)}
                </p>
                <EnterpriseTable ariaLabel={`Deliverables for ${sponsorAudienceSectionHeading(bucket)}`} className={tableClassName}>
                  {thead}
                  <EnterpriseTableBody>{renderArtifactRows(slice)}</EnterpriseTableBody>
                </EnterpriseTable>
              </section>
            );
          })}
        </div>
        {integrityDetails}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <EnterpriseTable ariaLabel="Architecture package artifacts" className={tableClassName}>
        {thead}
        <EnterpriseTableBody>{renderArtifactRows(sorted)}</EnterpriseTableBody>
      </EnterpriseTable>
      {!omitIntegrityDetails && sponsorMode && sorted.length > 0 ? (
        <ArtifactIntegrityTechnicalDetails artifacts={sorted} />
      ) : null}
    </div>
  );
}
