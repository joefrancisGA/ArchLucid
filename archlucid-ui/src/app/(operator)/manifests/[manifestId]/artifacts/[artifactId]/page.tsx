import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtifactListTable } from "@/components/ArtifactListTable";
import { ArtifactReviewContent } from "@/components/ArtifactReviewContent";
import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import {
  OperatorMalformedCallout,
  OperatorWarningCallout,
} from "@/components/OperatorShellMessage";
import {
  fetchArtifactContentUtf8,
  getArtifactDescriptor,
  getArtifactDownloadUrl,
  getManifestSummary,
  listArtifacts,
} from "@/lib/api";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import {
  getArtifactBusinessLabel,
  getArtifactFormatLabel,
  getArtifactTypeDescription,
  prepareArtifactBodyText,
} from "@/lib/artifact-review-helpers";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { tryStaticDemoArtifacts } from "@/lib/operator-static-demo";
import {
  coerceArtifactDescriptor,
  coerceArtifactDescriptorList,
} from "@/lib/operator-response-guards";
import { isInvalidDynamicRouteToken, isInvalidManifestRouteId } from "@/lib/route-dynamic-param";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import type { ArtifactDescriptor } from "@/types/authority";

function formatUtc(iso: string): string {
  const parsed = Date.parse(iso);

  if (Number.isNaN(parsed)) {
    return iso;
  }

  return new Date(parsed).toLocaleString();
}

/** Server artifact review: metadata, in-shell preview, and sibling navigation. */
export default async function ManifestArtifactReviewPage({
  params,
}: {
  params: Promise<{ manifestId: string; artifactId: string }>;
}) {
  const { manifestId, artifactId } = await params;

  if (isInvalidManifestRouteId(manifestId) || isInvalidDynamicRouteToken(artifactId)) {
    notFound();
  }

  let descriptorLoadError: string | null = null;
  let descriptor: ArtifactDescriptor | null = null;

  try {
    const rawDescriptor = await getArtifactDescriptor(manifestId, artifactId);
    const coerced = coerceArtifactDescriptor(rawDescriptor);

    if (!coerced.ok) {
      descriptorLoadError = coerced.message;
    } else {
      descriptor = coerced.value;
    }
  } catch (error) {
    const failure = toApiLoadFailure(error);

    if (isApiNotFoundFailure(failure)) {
      notFound();
    }

    descriptorLoadError = failure.message;
  }

  let contentError: string | null = null;
  let contentType = "application/octet-stream";
  let byteLength = 0;
  let truncated = false;
  let prepared = prepareArtifactBodyText("", "plain", artifactId);

  if (descriptor !== null) {
    try {
      const content = await fetchArtifactContentUtf8(manifestId, artifactId);
      contentType = content.contentType;
      byteLength = content.byteLength;
      truncated = content.truncated;
      prepared = prepareArtifactBodyText(content.text, descriptor.format, descriptor.artifactType);
    } catch (error) {
      contentError = error instanceof Error ? error.message : "Artifact content could not be loaded.";
    }
  }

  let artifactsLoadWarning: string | null = null;
  let siblingArtifacts: ArtifactDescriptor[] = [];
  let runId: string | undefined;

  try {
    const summary = await getManifestSummary(manifestId);
    runId = summary.runId?.trim() || undefined;
  } catch {
    /* non-blocking */
  }

  try {
    const rawArtifacts = await listArtifacts(manifestId);
    const coercedArtifacts = coerceArtifactDescriptorList(rawArtifacts);

    if (!coercedArtifacts.ok) {
      artifactsLoadWarning = coercedArtifacts.message;
    } else {
      siblingArtifacts = coercedArtifacts.items;
    }
  } catch (error) {
    const demoArtifacts =
      runId !== undefined ? tryStaticDemoArtifacts(runId, manifestId) : tryStaticDemoArtifacts("", manifestId);

    if (demoArtifacts !== null) {
      siblingArtifacts = demoArtifacts;
    } else {
      artifactsLoadWarning = error instanceof Error ? error.message : "Artifact list could not be loaded.";
    }
  }

  if (descriptor === null && descriptorLoadError !== null) {
    return (
      <div className="w-full max-w-3xl p-4">
        <h2 className={OPERATOR_TYPOGRAPHY.pageTitle}>Artifact review</h2>
        <OperatorApiProblem fallbackMessage={descriptorLoadError} problem={null} correlationId={null} />
        <p className={cn("mt-3", OPERATOR_TYPOGRAPHY.helper)}>
          Return to the{" "}
          <Link className={OPERATOR_LINK.nav} href={signedRecordDetailPath(manifestId)}>
            signed review record
          </Link>
          .
        </p>
      </div>
    );
  }

  if (descriptor === null) {
    notFound();
  }

  const artifactLabel = getArtifactBusinessLabel(descriptor.artifactType);

  return (
    <div className="w-full max-w-[1200px] space-y-6 p-4">
      <nav aria-label="Breadcrumb" className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <Link className={OPERATOR_LINK.nav} href={signedRecordDetailPath(manifestId)}>
          Signed review record
        </Link>
        <span aria-hidden="true"> · </span>
        <span>{artifactLabel}</span>
      </nav>

      <header className="space-y-2">
        <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{descriptor.name}</h1>
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {getArtifactTypeDescription(descriptor.artifactType)}
        </p>
      </header>

      <section
        aria-labelledby="artifact-metadata-heading"
        className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      >
        <h2 id="artifact-metadata-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          What this artifact is
        </h2>
        <dl className={cn("m-0 mt-3 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <dt className={OPERATOR_TYPOGRAPHY.helper}>Output type</dt>
            <dd className="m-0 mt-0.5 text-al-text-primary">{artifactLabel}</dd>
          </div>
          <div>
            <dt className={OPERATOR_TYPOGRAPHY.helper}>Format</dt>
            <dd className="m-0 mt-0.5 text-al-text-primary">{getArtifactFormatLabel(descriptor.format)}</dd>
          </div>
          <div>
            <dt className={OPERATOR_TYPOGRAPHY.helper}>Created</dt>
            <dd className="m-0 mt-0.5 text-al-text-primary">{formatUtc(descriptor.createdUtc)}</dd>
          </div>
          <div>
            <dt className={OPERATOR_TYPOGRAPHY.helper}>Content hash</dt>
            <dd className="m-0 mt-0.5 break-all font-mono text-al-text-secondary">{descriptor.contentHash}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <ExportTrackedAnchor href={getArtifactDownloadUrl(manifestId, artifactId)}>
            Download full file
          </ExportTrackedAnchor>
        </div>
      </section>

      <section aria-labelledby="artifact-preview-heading">
        <h2 id="artifact-preview-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Content preview
        </h2>
        <div className="mt-3">
          <ArtifactReviewContent
            prepared={prepared}
            contentType={contentType}
            byteLength={byteLength}
            truncated={truncated}
            contentError={contentError}
          />
        </div>
      </section>

      <section aria-labelledby="artifact-siblings-heading">
        <h2 id="artifact-siblings-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Artifacts in this package
        </h2>
        {artifactsLoadWarning !== null ? (
          <div className="mt-3">
            <OperatorWarningCallout>
              <p className="m-0">{artifactsLoadWarning}</p>
            </OperatorWarningCallout>
          </div>
        ) : siblingArtifacts.length === 0 ? (
          <div className="mt-3">
            <OperatorMalformedCallout>
              No sibling artifacts were returned for this review.
            </OperatorMalformedCallout>
          </div>
        ) : (
          <div className="mt-3">
            <ArtifactListTable
              manifestId={manifestId}
              artifacts={siblingArtifacts}
              currentArtifactId={artifactId}
              runId={runId}
            />
          </div>
        )}
      </section>
    </div>
  );
}