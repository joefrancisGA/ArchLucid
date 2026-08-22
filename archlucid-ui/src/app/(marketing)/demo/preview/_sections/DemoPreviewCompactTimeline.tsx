import Link from "next/link";

import { AuthorityPipelineTimeline } from "@/components/AuthorityPipelineTimeline";
import {
  DEMO_PREVIEW_AUDIT_TRAIL_DISCLOSURE,
  DEMO_PREVIEW_AUDIT_TRAIL_SUMMARY,
  DEMO_PREVIEW_LIFECYCLE_HEADING,
  DEMO_PREVIEW_LIFECYCLE_SUPPORTING,
  DEMO_PREVIEW_TECHNICAL_DETAILS_DISCLOSURE,
} from "@/lib/demo-preview-page-copy";
import { buildDemoPreviewTimelineRows } from "@/lib/demo-preview-timeline-present";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { ShowcaseFunnelTelemetryAnchor } from "@/lib/marketing/showcase-funnel-telemetry-anchor";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import type { ShowcaseDemoPreviewTelemetry } from "@/lib/marketing/showcase-telemetry";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import type { PipelineTimelineItem } from "@/types/authority";
import { cn } from "@/lib/utils";

type DemoPreviewCompactTimelineProps = {
  readonly payload: DemoCommitPagePreviewResponse;
  readonly pipelineItems: PipelineTimelineItem[];
  readonly primaryFindingId?: string;
  readonly isRunDetailAvailable: boolean;
  readonly showcaseTelemetry?: ShowcaseDemoPreviewTelemetry;
};

function safeLocaleTime(iso: string): string {
  if (iso.trim().length === 0) {
    return " — ";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return " — ";
  }

  return date.toLocaleString();
}

export function DemoPreviewCompactTimeline(props: DemoPreviewCompactTimelineProps) {
  const runId = props.payload.run?.runId ?? "";
  const manifestId = props.payload.manifest?.manifestId ?? props.payload.authorityChain?.goldenManifestId ?? null;
  const rows = buildDemoPreviewTimelineRows(props.pipelineItems, {
    runId,
    manifestId: typeof manifestId === "string" ? manifestId : null,
    primaryFindingId: props.primaryFindingId,
    isRunDetailAvailable: props.isRunDetailAvailable,
  });

  const themes = Array.isArray(props.payload.runExplanation?.themeSummaries)
    ? props.payload.runExplanation.themeSummaries.join(" · ")
    : " — ";
  const manifest = props.payload.manifest;

  return (
    <section
      id="artifact-audit-trail"
      className="scroll-mt-24 space-y-4"
      data-testid="demo-preview-review-trail"
    >
      <div>
        <h2 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}>
          {DEMO_PREVIEW_LIFECYCLE_HEADING}
        </h2>
        <p className={cn("m-0 mt-2 max-w-3xl text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
          {DEMO_PREVIEW_LIFECYCLE_SUPPORTING}
        </p>
      </div>

      <ol className="m-0 list-none space-y-0 p-0" aria-label="Review lifecycle milestones" data-testid="demo-preview-compact-timeline">
        {rows.map((row, index) => (
          <li key={row.eventId} className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
              <span
                className="h-2.5 w-2.5 rounded-full bg-teal-700 dark:bg-teal-400"
                aria-hidden
                data-testid="demo-preview-timeline-marker"
              />
              {index < rows.length - 1 ? (
                <span className="mt-1 w-px flex-1 bg-neutral-300 dark:bg-neutral-700" aria-hidden />
              ) : null}
            </div>
            <div className={cn("min-w-0 flex-1 pb-3", index < rows.length - 1 ? "border-b border-neutral-200 dark:border-neutral-800" : "")}>
              <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", MARKETING_TYPOGRAPHY.cardTitle)}>
                {row.title}
              </p>
              <time className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)} dateTime={row.occurredUtc}>
                {safeLocaleTime(row.occurredUtc)}
              </time>
              {row.actorUserName.trim().length > 0 ? (
                <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
                  {row.actorUserName}
                </p>
              ) : null}
              {row.action !== null ? (
                <p className="m-0 mt-2">
                  {props.showcaseTelemetry && row.action.href.includes("/findings/") ? (
                    <ShowcaseFunnelTelemetryAnchor
                      href={row.action.href}
                      className={MARKETING_SURFACES.inlineLink}
                      data-testid={`demo-preview-timeline-action-${row.eventId}`}
                      scenario={props.showcaseTelemetry.scenario}
                      renderMode={props.showcaseTelemetry.renderMode}
                      funnelAction="finding_open"
                    >
                      {row.action.label}
                    </ShowcaseFunnelTelemetryAnchor>
                  ) : (
                    <Link
                      href={row.action.href}
                      className={MARKETING_SURFACES.inlineLink}
                      data-testid={`demo-preview-timeline-action-${row.eventId}`}
                    >
                      {row.action.label}
                    </Link>
                  )}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <details className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <summary className="cursor-pointer select-none font-medium text-neutral-900 dark:text-neutral-100">
          {DEMO_PREVIEW_AUDIT_TRAIL_DISCLOSURE}
        </summary>
        <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
          {DEMO_PREVIEW_AUDIT_TRAIL_SUMMARY(rows.length)}
        </p>
        <div className="mt-3" data-testid="demo-preview-pipeline-timeline">
          <AuthorityPipelineTimeline items={props.pipelineItems} omitEventTechnicalDetails />
        </div>
      </details>

      <details className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <summary className="cursor-pointer select-none font-medium text-neutral-900 dark:text-neutral-100">
          {DEMO_PREVIEW_TECHNICAL_DETAILS_DISCLOSURE}
        </summary>
        <dl className="m-0 mt-3 grid gap-2 sm:grid-cols-[minmax(10rem,auto)_1fr] sm:gap-x-4">
          <dt className={cn("font-medium text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
            Evidence categories
          </dt>
          <dd className={cn("m-0 text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.body)}>{themes}</dd>
          <dt className={cn("font-medium text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
            Applied policy pack
          </dt>
          <dd className={cn("m-0 text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.body)}>
            {manifest ? policyPackBuyerLabel(manifest.ruleSetId ?? "", manifest.ruleSetVersion ?? "") : " — "}
          </dd>
          <dt className={cn("font-medium text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>Review scope</dt>
          <dd className={cn("m-0 text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.body)}>
            {manifest?.operatorSummary ?? props.payload.run?.description ?? " — "}
          </dd>
          <dt className={cn("font-medium text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
            Artifact types
          </dt>
          <dd className={cn("m-0 text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.body)}>
            {(props.payload.artifacts ?? []).map((artifact) => artifact.artifactType).join(" · ") || " — "}
          </dd>
        </dl>
      </details>
    </section>
  );
}
