"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArtifactPreviewSponsorExportVocabularyRail } from "@/components/ArtifactPreviewSponsorExportVocabularyRail";
import { RoiSponsorExportVocabularyRail } from "@/components/RoiSponsorExportVocabularyRail";
import { getRunPackageExportUrl } from "@/lib/api";
import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isExplicitStaticDemoMarketingBuild } from "@/lib/buyer/buyer-demo-content-gating";
import { filterCommittedRunsForPicker } from "@/lib/committed-run-picker";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";

type SponsorDocxTarget = {
  readonly runId: string;
  readonly manifestVersion: string;
};

type SponsorExportOutputCardProps = {
  readonly title: string;
  readonly description: string;
  readonly locked: boolean;
  readonly primaryActionLabel?: string;
  readonly primaryHref?: string;
  readonly previewActionLabel?: string;
  readonly previewHref?: string;
  readonly externalHref?: string;
  readonly testId?: string;
};

function SponsorExportOutputCard(props: SponsorExportOutputCardProps): React.JSX.Element {
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;
  const locked = props.locked;
  const showPreview = locked && props.previewHref !== undefined && props.previewActionLabel !== undefined;
  const showPrimary = !locked && (props.primaryHref !== undefined || props.externalHref !== undefined);

  return (
    <Card
      className={cn(locked ? "border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-950/30" : undefined)}
      data-testid={props.testId}
    >
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{props.title}</CardTitle>
        <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>{props.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {locked ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{v.sponsorExportsUnavailableFootnote}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {showPreview ? (
            <Button asChild size="sm" variant="outline" className="border-neutral-300 dark:border-neutral-600">
              <Link
                href={props.previewHref ?? "#"}
                data-testid={props.testId !== undefined ? `${props.testId}-preview-action` : undefined}
              >
                {props.previewActionLabel}
              </Link>
            </Button>
          ) : null}
          {showPrimary ? (
            <Button asChild size="sm" variant="outline" className="border-neutral-300 dark:border-neutral-600">
              {props.externalHref !== undefined ? (
                <a
                  href={props.externalHref}
                  data-testid={props.testId !== undefined ? `${props.testId}-action` : undefined}
                >
                  {props.primaryActionLabel}
                </a>
              ) : (
                <Link
                  href={props.primaryHref ?? "#"}
                  data-testid={props.testId !== undefined ? `${props.testId}-action` : undefined}
                >
                  {props.primaryActionLabel}
                </Link>
              )}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Sponsor-ready quick links for sponsor reporting exports and ROI framing context.
 * Includes a direct architecture review report DOCX download for the first committed review
 * (`GET /v1/runs/{runId}/export/docx`).
 */
export type SponsorExportsSectionProps = {
  readonly surface?: "operator" | "sponsor";
  readonly hasCommittedReviews?: boolean;
};

export function SponsorExportsSection({
  surface = "operator",
  hasCommittedReviews = false,
}: SponsorExportsSectionProps) {
  const executiveSurface = surface === "sponsor";
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;
  const exportsLocked = !hasCommittedReviews;
  const runsQuery = useAskProjectRunsQuery("default", {
    committedOnly: true,
    mergeDemoOnEmpty: isExplicitStaticDemoMarketingBuild(),
  });

  const sponsorDocx = useMemo((): SponsorDocxTarget | null => {
    if (runsQuery.data === undefined) {
      return null;
    }

    const committed = filterCommittedRunsForPicker(runsQuery.data.items);
    const first = committed[0];

    return first !== undefined
      ? {
          runId: first.runId,
          manifestVersion: first.goldenManifestId?.trim() || first.currentManifestVersion?.trim() || first.runId,
        }
      : null;
  }, [runsQuery.data]);

  return (
    <section
      id="sponsor-exports"
      aria-labelledby="sponsor-exports-heading"
      className="scroll-mt-24 space-y-3"
    >
      <div>
        <h2 id="sponsor-exports-heading" className={`m-0 ${OPERATOR_TYPOGRAPHY.sectionTitle}`} data-testid="sponsor-exports-heading">
          {executiveSurface ? v.executiveExportsTitle : "Sponsor exports"}
        </h2>
        {executiveSurface ? (
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{v.executiveExportsDescription}</p>
        ) : null}
      </div>
      <RoiSponsorExportVocabularyRail currentSurfaceId="sponsor-dashboard" />
      <ArtifactPreviewSponsorExportVocabularyRail currentSurfaceId="sponsor-export" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sponsorDocx !== null ? (
          <SponsorExportOutputCard
            title={v.sponsorExportsDocxTitle}
            description={v.sponsorExportsDocxDescription}
            locked={
              runCollateralSealedManifestCopyBlockedReason({
                runId: sponsorDocx.runId,
                manifestVersion: sponsorDocx.manifestVersion,
              }) !== null
            }
            primaryActionLabel={v.sponsorExportsDocxAction}
            externalHref={getRunPackageExportUrl(sponsorDocx.runId, "docx")}
            testId="sponsor-exports-docx-download"
          />
        ) : null}
        <SponsorExportOutputCard
          title={v.sponsorExportsScorecardTitle}
          description={v.sponsorExportsScorecardDescription}
          locked={exportsLocked}
          primaryActionLabel={v.sponsorExportsScorecardAction}
          primaryHref={SPONSOR_DASHBOARD_HREF}
          previewActionLabel={v.sponsorExportsPreviewSampleAction}
          previewHref={ARCHITECTURE_SCORECARD_PATH}
          testId="sponsor-exports-scorecard"
        />
        <SponsorExportOutputCard
          title={v.sponsorExportsPilotValueTitle}
          description={v.sponsorExportsPilotValueDescription}
          locked={exportsLocked}
          primaryActionLabel={v.sponsorExportsPilotValueAction}
          primaryHref="/insights/sponsor-report"
          previewActionLabel={v.sponsorExportsPreviewSampleAction}
          previewHref={v.sponsorExportsPilotValueSampleHref}
          testId="sponsor-exports-pilot-value"
        />
        <SponsorExportOutputCard
          title={v.sponsorExportsRoiTitle}
          description={v.sponsorExportsRoiDescription}
          locked={false}
          primaryActionLabel={v.sponsorExportsRoiAction}
          primaryHref="/insights/roi-summary"
          testId="sponsor-exports-roi-methodology"
        />
      </div>
    </section>
  );
}
