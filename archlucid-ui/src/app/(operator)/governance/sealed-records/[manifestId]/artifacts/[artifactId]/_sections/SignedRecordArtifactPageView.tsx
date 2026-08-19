"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { ArtifactListTable } from "@/components/ArtifactListTable";
import { ArtifactPreviewSponsorExportVocabularyRail } from "@/components/ArtifactPreviewSponsorExportVocabularyRail";
import { ArtifactReviewContent } from "@/components/ArtifactReviewContent";
import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { HelpCopyableValue } from "@/components/help/HelpCopyableValue";
import { GovernanceSealedRecordArtifactBreadcrumb } from "@/components/governance/GovernanceSealedRecordArtifactBreadcrumb";
import { OperatorDemoStaticBanner } from "@/components/operator/OperatorDemoStaticBanner";
import {
  OperatorEvidenceLimitsFooter,
} from "@/components/operator/OperatorEvidenceLimitsFooter";
import { OperatorWarningCallout } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getArtifactDownloadUrl } from "@/lib/api";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import {
  getArtifactDisplayLabel,
  getArtifactFormatLabel,
  getArtifactTypeDescription,
} from "@/lib/artifact-review-helpers";
import {
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  SIGNED_RECORD_ARTIFACT_CONTENT_HASH_LABEL,
  SIGNED_RECORD_ARTIFACT_DOWNLOAD_UNAVAILABLE,
  SIGNED_RECORD_ARTIFACT_GENERATED_LABEL,
  SIGNED_RECORD_ARTIFACT_PREVIEW_RETRY,
  SIGNED_RECORD_ARTIFACT_SIBLINGS_HEADING,
  SIGNED_RECORD_ARTIFACT_WHAT_IS_THIS_HEADING,
  signedRecordArtifactPageSubtitle,
} from "@/lib/signed-record-artifact-page-copy";
import { signedRecordArtifactPath } from "@/lib/signed-records-paths";
import { SignedRecordArtifactGeneratedTimestamp } from "./signed-record-artifact-generated-timestamp";
import { SignedRecordArtifactPageHeader } from "./SignedRecordArtifactPageHeader";
import { SignedRecordArtifactPageSkeleton } from "./SignedRecordArtifactPageSkeleton";
import type { SignedRecordArtifactPageSuccessModel } from "./signed-record-artifact-page-model";

type SignedRecordArtifactPageViewProps = {
  readonly model: SignedRecordArtifactPageSuccessModel;
};

/** Buyer-safe artifact preview for GAR `/governance/sealed-records/.../artifacts/...`. */
export function SignedRecordArtifactPageView(props: SignedRecordArtifactPageViewProps): React.JSX.Element {
  const router = useRouter();
  const model = props.model;
  const buyerPolishedLayout = model.buyerPolishedLayout;
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  useEffect(() => {
    setLastRefreshedAt(new Date());
    setRefreshing(false);
  }, [model]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    router.refresh();
    setLastRefreshedAt(new Date());
  }, [router]);

  const displayLabel = getArtifactDisplayLabel({
    artifactId: model.descriptor.artifactId,
    artifactType: model.descriptor.artifactType,
  });

  const breadcrumb = (
    <GovernanceSealedRecordArtifactBreadcrumb
      manifestId={model.manifestId}
      artifactId={model.artifactId}
      artifactType={model.descriptor.artifactType}
      runId={model.runId}
    />
  );

  const downloadAvailable = model.contentError === null;

  return (
    <div className={cn("w-full max-w-[1200px] px-1 py-2 sm:px-0", OPERATOR_LAYOUT.sectionStack)} data-testid="signed-record-artifact-page">
      <SignedRecordArtifactPageHeader
        subtitle={signedRecordArtifactPageSubtitle(buyerPolishedLayout)}
        breadcrumb={breadcrumb}
        refreshing={refreshing}
        onRefresh={onRefresh}
        lastRefreshedAt={lastRefreshedAt}
      />

      {model.usedStaticDemoFallback && isOperatorExperienceFullShellEnv() ? (
        <div className="max-w-5xl">
          <OperatorDemoStaticBanner emphasizeSampleData />
        </div>
      ) : null}

      <ArtifactPreviewSponsorExportVocabularyRail
        currentSurfaceId="artifact-preview"
        artifactHref={signedRecordArtifactPath(model.manifestId, model.descriptor.artifactId)}
        runId={model.runId}
      />

      {refreshing ? (
        <SignedRecordArtifactPageSkeleton />
      ) : (
        <>
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
                  <dt className={OPERATOR_TYPOGRAPHY.label}>{SIGNED_RECORD_ARTIFACT_GENERATED_LABEL}</dt>
                  <dd className="m-0 mt-1">
                    <SignedRecordArtifactGeneratedTimestamp createdUtc={model.descriptor.createdUtc} />
                  </dd>
                </div>
                <div>
                  <HelpCopyableValue
                    label={SIGNED_RECORD_ARTIFACT_CONTENT_HASH_LABEL}
                    value={model.descriptor.contentHash}
                    testId="signed-record-artifact-content-hash"
                  />
                </div>
              </dl>
              {downloadAvailable ? (
                <ExportTrackedAnchor href={getArtifactDownloadUrl(model.manifestId, model.artifactId)}>
                  Download artifact
                </ExportTrackedAnchor>
              ) : (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="signed-record-artifact-download-unavailable">
                  {SIGNED_RECORD_ARTIFACT_DOWNLOAD_UNAVAILABLE}
                </p>
              )}
            </CardContent>
          </Card>

          <section aria-labelledby="signed-record-artifact-preview-heading" className="space-y-3">
            <h2 id="signed-record-artifact-preview-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Preview
            </h2>
            {model.contentError !== null ? (
              <div data-testid="signed-record-artifact-content-error"><OperatorWarningCallout>
                <strong>In-shell preview unavailable.</strong>
                <p className="mt-2">{model.contentError}</p>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid="signed-record-artifact-preview-retry-button"
                    onClick={onRefresh}
                  >
                    {SIGNED_RECORD_ARTIFACT_PREVIEW_RETRY}
                  </Button>
                </div>
              </OperatorWarningCallout></div>) : (
              <ArtifactReviewContent
                prepared={model.prepared}
                contentType={model.contentType}
                byteLength={model.byteLength}
                truncated={model.truncated}
                contentError={null}
              />
            )}
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

          {model.runId !== null ? (
            <OperatorEvidenceLimitsFooter runId={model.runId} showArchitectureReviewSummaryLink />
          ) : null}
        </>
      )}
    </div>
  );
}
