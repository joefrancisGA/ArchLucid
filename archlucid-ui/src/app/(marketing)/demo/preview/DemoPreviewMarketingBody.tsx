import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import type { PipelineTimelineItem } from "@/types/authority";
import { isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackActiveForRun } from "@/lib/operator/operator-static-demo";
import {
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

import { DemoPreviewArtifactNav } from "./_sections/DemoPreviewArtifactNav";
import {
  DemoPreviewEvidenceGraphSection,
  DemoPreviewSponsorConclusion,
  DemoPreviewGovernanceSection,
  DemoPreviewSignedReviewSection,
} from "./_sections/DemoPreviewArtifactSections";
import { DemoPreviewEvaluationCta, DemoPreviewSignInCallout } from "./_sections/DemoPreviewCallouts";
import { DemoPreviewCompactTimeline } from "./_sections/DemoPreviewCompactTimeline";
import { DemoPreviewDeliverablesSection } from "./_sections/DemoPreviewDeliverablesSection";
import type { ShowcaseDemoPreviewTelemetry } from "@/lib/marketing/showcase-telemetry";

/** Maps marketing preview timeline rows to operator pipeline timeline shape for shared timeline UI. */
function toAuthorityPipelineItems(
  timeline: DemoCommitPagePreviewResponse["pipelineTimeline"],
): PipelineTimelineItem[] {
  if (!Array.isArray(timeline)) {
    return [];
  }

  return timeline.map((event, index) => ({
    eventId:
      typeof event.eventId === "string" && event.eventId.trim().length > 0 ? event.eventId.trim() : `timeline-row-${index}`,
    occurredUtc: typeof event.occurredUtc === "string" ? event.occurredUtc : "",
    eventType: typeof event.eventType === "string" ? event.eventType : "",
    actorUserName: typeof event.actorUserName === "string" ? event.actorUserName : "",
    correlationId: event.correlationId ?? null,
  }));
}

export type DemoPreviewMarketingBodyProps = {
  readonly payload: DemoCommitPagePreviewResponse;
  /** Parent surfaces its own demo banner ΓÇö omit duplicate banner noise on `/showcase`. */
  readonly suppressStatusBanner?: boolean;
  /**
   * When true (default), hide raw identifiers and engineer phrasing suitable for procurement viewers.
   * Pass false only in tests or tooling that assert fixture metadata.
   */
  readonly buyerAudienceChrome?: boolean;
  /** When set on `/showcase`, enables scenario-tagged funnel telemetry (TB-978). */
  readonly showcaseTelemetry?: ShowcaseDemoPreviewTelemetry;
};

/** Marketing-only commit page projection (no operator CTAs). */
export function DemoPreviewMarketingBody({
  payload,
  buyerAudienceChrome = true,
  showcaseTelemetry,
}: DemoPreviewMarketingBodyProps) {
  const demoMode = buyerAudienceChrome || isBuyerSafeDemoMarketingChromeEnv();
  const payloadRunId = typeof payload.run?.runId === "string" ? payload.run.runId.trim() : "";
  const isRunDetailAvailable = payloadRunId.length > 0 && isStaticDemoPayloadFallbackActiveForRun(payloadRunId);
  const pipelineItems = toAuthorityPipelineItems(payload.pipelineTimeline);
  const primaryFindingId =
    payloadRunId === SHOWCASE_STATIC_DEMO_RUN_ID ? SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID : undefined;

  if (!demoMode) {
    return (
      <div className="space-y-8" data-testid="demo-preview-engineering-body">
        <DemoPreviewSponsorConclusion payload={payload} />
        <DemoPreviewCompactTimeline
          payload={payload}
          pipelineItems={pipelineItems}
          primaryFindingId={primaryFindingId}
          isRunDetailAvailable={isRunDetailAvailable}
        />
        <DemoPreviewDeliverablesSection payload={payload} />
      </div>
    );
  }

  return (
    <div className="space-y-10" data-testid="demo-preview-marketing-body">
      <DemoPreviewArtifactNav showcaseTelemetry={showcaseTelemetry} />
      <DemoPreviewSponsorConclusion payload={payload} />
      <DemoPreviewSignedReviewSection payload={payload} />
      <DemoPreviewEvidenceGraphSection payload={payload} showcaseTelemetry={showcaseTelemetry} />
      <DemoPreviewGovernanceSection payload={payload} />
      <DemoPreviewCompactTimeline
        payload={payload}
        pipelineItems={pipelineItems}
        primaryFindingId={primaryFindingId}
        isRunDetailAvailable={isRunDetailAvailable}
        showcaseTelemetry={showcaseTelemetry}
      />
      <DemoPreviewDeliverablesSection payload={payload} />
      <DemoPreviewSignInCallout />
      <DemoPreviewEvaluationCta />
    </div>
  );
}

// Re-export unavailable states for existing imports/tests.
export { DemoPreviewFriendlyUnavailable, DemoPreviewNotAvailable } from "./_sections/DemoPreviewUnavailable";
