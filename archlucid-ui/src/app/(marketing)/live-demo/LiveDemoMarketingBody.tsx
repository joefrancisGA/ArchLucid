"use client";

import { isStaticDemoPayloadFallbackActiveForRun } from "@/lib/operator-static-demo";
import { canShowcaseAnonymousVisitorOpenOperatorDeepLinks } from "@/lib/showcase-quick-nav-contract";
import {
  LIVE_DEMO_WALKTHROUGH_STEPS,
  type LiveDemoWalkthroughStepId,
} from "@/lib/live-demo-walkthrough-steps";
import {
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import type { PipelineTimelineItem } from "@/types/authority";

import { LiveDemoAuditTrailStepContent } from "./LiveDemoAuditTrailStepContent";
import { LiveDemoContinuousWalkthrough } from "./LiveDemoContinuousWalkthrough";
import { LiveDemoConversionCta } from "./LiveDemoConversionCta";
import { LiveDemoEvidenceStepContent } from "./LiveDemoEvidenceStepContent";
import { LiveDemoExecutiveStepContent } from "./LiveDemoExecutiveStepContent";
import { LiveDemoGovernanceStepContent } from "./LiveDemoGovernanceStepContent";
import { LiveDemoSignedRecordStepContent } from "./LiveDemoSignedRecordStepContent";
import { LiveDemoWalkthroughChrome } from "./LiveDemoWalkthroughChrome";

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

type LiveDemoMarketingBodyProps = {
  readonly payload: DemoCommitPagePreviewResponse;
  readonly activeStepId: LiveDemoWalkthroughStepId;
};

type LiveDemoSharedStepProps = {
  readonly payload: DemoCommitPagePreviewResponse;
  readonly runId: string;
  readonly manifestId: string | null;
  readonly operatorDeepLinksAvailable: boolean;
  readonly pipelineItems: PipelineTimelineItem[];
  readonly primaryFindingId?: string;
  readonly isRunDetailAvailable: boolean;
};

function renderLiveDemoStepPanel(stepId: LiveDemoWalkthroughStepId, shared: LiveDemoSharedStepProps, keyTakeaway: string) {
  switch (stepId) {
    case "executive":
      return <LiveDemoExecutiveStepContent {...shared} keyTakeaway={keyTakeaway} />;
    case "signed-record":
      return <LiveDemoSignedRecordStepContent {...shared} keyTakeaway={keyTakeaway} />;
    case "evidence":
      return <LiveDemoEvidenceStepContent {...shared} keyTakeaway={keyTakeaway} />;
    case "governance":
      return <LiveDemoGovernanceStepContent {...shared} keyTakeaway={keyTakeaway} />;
    case "audit-trail":
      return (
        <LiveDemoAuditTrailStepContent
          {...shared}
          keyTakeaway={keyTakeaway}
        />
      );
    default: {
      const exhaustive: never = stepId;
      return exhaustive;
    }
  }
}

export function LiveDemoMarketingBody(props: LiveDemoMarketingBodyProps) {
  const payloadRunId = typeof props.payload.run?.runId === "string" ? props.payload.run.runId.trim() : "";
  const effectiveRunId = payloadRunId.length > 0 ? payloadRunId : SHOWCASE_STATIC_DEMO_RUN_ID;
  const manifestId =
    typeof props.payload.manifest?.manifestId === "string" && props.payload.manifest.manifestId.trim().length > 0
      ? props.payload.manifest.manifestId.trim()
      : null;
  const isRunDetailAvailable = payloadRunId.length > 0 && isStaticDemoPayloadFallbackActiveForRun(payloadRunId);
  const operatorDeepLinksAvailable = canShowcaseAnonymousVisitorOpenOperatorDeepLinks(effectiveRunId);
  const primaryFindingId = effectiveRunId === SHOWCASE_STATIC_DEMO_RUN_ID ? SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID : undefined;
  const pipelineItems = toAuthorityPipelineItems(props.payload.pipelineTimeline);
  const activeStep = LIVE_DEMO_WALKTHROUGH_STEPS.find((step) => step.id === props.activeStepId) ?? LIVE_DEMO_WALKTHROUGH_STEPS[0];

  const shared: LiveDemoSharedStepProps = {
    payload: props.payload,
    runId: effectiveRunId,
    manifestId,
    operatorDeepLinksAvailable,
    pipelineItems,
    primaryFindingId,
    isRunDetailAvailable,
  };

  return (
    <LiveDemoWalkthroughChrome
      activeStepId={activeStep.id}
      guidedPanel={renderLiveDemoStepPanel(activeStep.id, shared, activeStep.keyTakeaway)}
      continuousPanels={
        <LiveDemoContinuousWalkthrough
          initialStepId={activeStep.id}
          renderStepPanel={(stepId) => {
            const step = LIVE_DEMO_WALKTHROUGH_STEPS.find((candidate) => candidate.id === stepId);

            if (step === undefined) {
              return null;
            }

            return renderLiveDemoStepPanel(step.id, shared, step.keyTakeaway);
          }}
        />
      }
      conversionCta={
        <LiveDemoConversionCta
          runId={effectiveRunId}
          manifestId={manifestId}
          operatorDeepLinksAvailable={operatorDeepLinksAvailable}
        />
      }
    />
  );
}
