"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getArtifactDownloadUrl } from "@/lib/api";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isExplicitStaticDemoMarketingBuild } from "@/lib/buyer-demo-content-gating";
import { filterCommittedRunsForPicker } from "@/lib/committed-run-picker";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator-run-picker-client";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type SponsorDocxTarget = {
  readonly runId: string;
  readonly manifestId: string;
};

type SponsorExportRowProps = {
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly href?: string;
  readonly externalHref?: string;
  readonly disabled?: boolean;
  readonly unavailableFootnote?: string;
  readonly testId?: string;
};

function SponsorExportRow(props: SponsorExportRowProps): React.JSX.Element {
  const disabled = props.disabled === true || (props.href === undefined && props.externalHref === undefined);

  return (
    <li
      className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
      data-testid={props.testId}
    >
      <div className="min-w-0 flex-1">
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{props.title}</p>
        <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.description}</p>

        {disabled && props.unavailableFootnote !== undefined ? (
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{props.unavailableFootnote}</p>
        ) : null}
      </div>

      {!disabled ? (
        <Button asChild size="sm" variant="outline" className="shrink-0 border-neutral-300 dark:border-neutral-600">
          {props.externalHref !== undefined ? (
            <a href={props.externalHref} data-testid={props.testId !== undefined ? `${props.testId}-action` : undefined}>
              {props.actionLabel}
            </a>
          ) : (
            <Link href={props.href ?? "#"} data-testid={props.testId !== undefined ? `${props.testId}-action` : undefined}>
              {props.actionLabel}
            </Link>
          )}
        </Button>
      ) : null}
    </li>
  );
}

/**
 * Sponsor-ready quick links for executive reporting exports and ROI framing context.
 * Includes a direct sponsor DOCX download when a committed manifest exposes `architecture-review-board`.
 */
export type SponsorExportsSectionProps = {
  readonly surface?: "operator" | "executive";
  readonly hasCommittedReviews?: boolean;
};

export function SponsorExportsSection({
  surface = "operator",
  hasCommittedReviews = false,
}: SponsorExportsSectionProps) {
  const executiveSurface = surface === "executive";
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;
  const exportsLocked = !hasCommittedReviews;
  const [sponsorDocx, setSponsorDocx] = useState<SponsorDocxTarget | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { items } = await loadProjectRunsMergedWithDemoFallback("default", {
        committedOnly: true,
        mergeDemoOnEmpty: isExplicitStaticDemoMarketingBuild(),
      });
      const committed = filterCommittedRunsForPicker(items);

      for (const run of committed) {
        try {
          const response = await fetch(
            `/api/proxy/v1/runs/${encodeURIComponent(run.runId)}/artifacts`,
            mergeRegistrationScopeForProxy({ method: "GET" }),
          );

          if (!response.ok) {
            continue;
          }

          const artifacts = (await response.json()) as Array<{ artifactId?: string; manifestId?: string | null }>;
          const hasBoard = artifacts.some(
            (row) => (row.artifactId ?? "").toLowerCase() === "architecture-review-board",
          );
          const manifestId = artifacts
            .map((row) => (row.manifestId ?? "").trim())
            .find((id) => id.length > 0);

          if (hasBoard && manifestId !== undefined && !cancelled) {
            setSponsorDocx({ runId: run.runId, manifestId });
            break;
          }
        } catch {
          // Try next committed run.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle} data-testid="executive-exports-heading">
          {executiveSurface ? v.executiveExportsTitle : "Sponsor exports"}
        </CardTitle>
        {executiveSurface ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{v.executiveExportsDescription}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        <ul className={cn("m-0 list-none divide-y divide-neutral-200 dark:divide-neutral-800", OPERATOR_TYPOGRAPHY.body)}>
          {sponsorDocx !== null ? (
            <SponsorExportRow
              title={v.sponsorExportsDocxTitle}
              description={v.sponsorExportsDocxDescription}
              actionLabel={v.sponsorExportsDocxAction}
              externalHref={getArtifactDownloadUrl(sponsorDocx.manifestId, "architecture-review-board")}
              testId="sponsor-exports-docx-download"
            />
          ) : null}
          <SponsorExportRow
            title={v.sponsorExportsScorecardTitle}
            description={v.sponsorExportsScorecardDescription}
            actionLabel={v.sponsorExportsScorecardAction}
            href="/executive/scorecard"
            disabled={exportsLocked}
            unavailableFootnote={v.sponsorExportsUnavailableFootnote}
            testId="sponsor-exports-scorecard"
          />
          <SponsorExportRow
            title={v.sponsorExportsPilotValueTitle}
            description={v.sponsorExportsPilotValueDescription}
            actionLabel={v.sponsorExportsPilotValueAction}
            href="/value-report/pilot"
            disabled={exportsLocked}
            unavailableFootnote={v.sponsorExportsUnavailableFootnote}
            testId="sponsor-exports-pilot-value"
          />
          <SponsorExportRow
            title={v.sponsorExportsRoiTitle}
            description={v.sponsorExportsRoiDescription}
            actionLabel={v.sponsorExportsRoiAction}
            href="/value-report/roi"
            testId="sponsor-exports-roi-methodology"
          />
        </ul>
      </CardContent>
    </Card>
  );
}
