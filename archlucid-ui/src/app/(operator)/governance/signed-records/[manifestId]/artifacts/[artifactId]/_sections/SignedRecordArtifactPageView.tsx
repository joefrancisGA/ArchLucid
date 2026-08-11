"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { ArtifactListTable } from "@/components/ArtifactListTable";
import { ArtifactPreviewSponsorExportVocabularyRail } from "@/components/ArtifactPreviewSponsorExportVocabularyRail";
import { ArtifactReviewContent } from "@/components/ArtifactReviewContent";
import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getArtifactDownloadUrl } from "@/lib/api";
import { reviewDetailPath } from "@/lib/architecture-routes";
import {
  getArtifactDisplayLabel,
  getArtifactFormatLabel,
  getArtifactTypeDescription,
} from "@/lib/artifact-review-helpers";
import {
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  SIGNED_RECORD_ARTIFACT_SIBLINGS_HEADING,
  SIGNED_RECORD_ARTIFACT_WHAT_IS_THIS_HEADING,
  signedRecordArtifactPageSubtitle,
} from "@/lib/signed-record-artifact-page-copy";
import {
  SIGNED_RECORDS_LIST_PATH,
  signedRecordArtifactPath,
  signedRecordDetailPath,
} from "@/lib/signed-records-paths";
import { SignedRecordArtifactPageHeader } from "./SignedRecordArtifactPageHeader";
import type { SignedRecordArtifactPageSuccessModel } from "./signed-record-artifact-page-model";

type SignedRecordArtifactPageViewProps = {
  readonly model: SignedRecordArtifactPageSuccessModel;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/** Buyer-safe artifact preview for GAR `/governance/signed-records/.../artifacts/...`. */
export function SignedRecordArtifactPageView(props: SignedRecordArtifactPageViewProps): React.JSX.Element {
  const model = props.model;
  const buyerPolishedLayout = model.buyerPolishedLayout;
  const displayLabel = getArtifactDisplayLabel({
    artifactId: model.descriptor.artifactId,
    artifactType: model.descriptor.artifactType,
  });

  return (
    <div className="w-full max-w-[1200px] space-y-6 px-1 py-2 sm:px-0" data-testid="signed-record-artifact-page">
      <nav aria-label="Breadcrumb" className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <Link className={OPERATOR_LINK.nav} href={SIGNED_RECORDS_LIST_PATH}>
          Signed review records
        </Link>
        {" · "}
        <Link className={OPERATOR_LINK.nav} href={signedRecordDetailPath(model.manifestId)}>
          Signed record
        </Link>
        {model.runId !== null ? (
          <>
            {" · "}
            <Link className={OPERATOR_LINK.nav} href={reviewDetailPath(model.runId)}>
              Open review
            </Link>
          </>
        ) : null}
        {" · "}
        <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} aria-current="page">
          {displayLabel}
        </span>
      </nav>

      <SignedRecordArtifactPageHeader subtitle={signedRecordArtifactPageSubtitle(buyerPolishedLayout)} />
      <ArtifactPreviewSponsorExportVocabularyRail
        currentSurfaceId="artifact-preview"
        artifactHref={signedRecordArtifactPath(model.manifestId, model.descriptor.artifactId)}
        runId={model.runId}
      />
<Card data-testid="signed-record-artifact-metadata-card">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{SIGNED_RECORD_ARTIFACT_WHAT_IS_THIS_HEADING}</CardTitle>
          <CardDescription>{getArtifactTypeDescription(model.descriptor.artifactType)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className={OPERATOR_TYPOGRAPHY.label}>Output</dt>
              <dd className="m-0 mt-1 font-medium text-al-text-primary">{displayLabel}</dd>
            </div>
            <div>
              <dt className={OPERATOR_TYPOGRAPHY.label}>Format</dt>
              <dd className="m-0 mt-1">{getArtifactFormatLabel(model.descriptor.format)}</dd>
            </div>
            <div>
              <dt className={OPERATOR_TYPOGRAPHY.label}>Generated</dt>
              <dd className="m-0 mt-1">{formatDate(model.descriptor.createdUtc)}</dd>
            </div>
            <div>
              <dt className={OPERATOR_TYPOGRAPHY.label}>Content hash</dt>
              <dd className="m-0 mt-1 font-mono text-sm break-all">{model.descriptor.contentHash}</dd>
            </div>
          </dl>
          <ExportTrackedAnchor href={getArtifactDownloadUrl(model.manifestId, model.artifactId)}>
            Download artifact
          </ExportTrackedAnchor>
        </CardContent>
      </Card>

      <section aria-labelledby="signed-record-artifact-preview-heading" className="space-y-3">
        <h2 id="signed-record-artifact-preview-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Preview
        </h2>
        <ArtifactReviewContent
          prepared={model.prepared}
          contentType={model.contentType}
          byteLength={model.byteLength}
          truncated={model.truncated}
          contentError={model.contentError}
        />
      </section>

      {model.siblings.length > 0 ? (
        <section aria-labelledby="signed-record-artifact-siblings-heading" className="space-y-3">
          <h2 id="signed-record-artifact-siblings-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {SIGNED_RECORD_ARTIFACT_SIBLINGS_HEADING}
          </h2>
          <ArtifactListTable
            manifestId={model.manifestId}
            artifacts={model.siblings}
            currentArtifactId={model.artifactId}
            runId={model.runId ?? undefined}
            sponsorMode={buyerPolishedLayout}
          />
        </section>
      ) : null}
    </div>
  );
}
