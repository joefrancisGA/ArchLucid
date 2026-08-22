import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import type { PipelineTimelineItem } from "@/types/authority";

export type DemoPreviewTimelineAction = {
  readonly label: string;
  readonly href: string;
};

export type DemoPreviewTimelineRow = {
  readonly eventId: string;
  readonly title: string;
  readonly occurredUtc: string;
  readonly actorUserName: string;
  readonly action: DemoPreviewTimelineAction | null;
};

type TimelineActionContext = {
  readonly runId: string;
  readonly manifestId: string | null;
  readonly primaryFindingId?: string;
  readonly isRunDetailAvailable: boolean;
};

function enc(value: string): string {
  return encodeURIComponent(value.trim());
}

function resolveTimelineAction(
  eventType: string,
  context: TimelineActionContext,
): DemoPreviewTimelineAction | null {
  const normalized = eventType.trim().toLowerCase();
  const runHref = context.isRunDetailAvailable ? `/architecture/reviews/${enc(context.runId)}` : "#artifact-signed-review-record";
  const manifestHref =
    context.manifestId !== null ? signedRecordDetailPath(context.manifestId) : "#artifact-signed-review-record";

  if (normalized === "runstarted" || normalized === "run.started") {
    return { label: "Open review", href: runHref };
  }

  if (normalized.includes("context.snapshot")) {
    return { label: "View evidence graph", href: "#artifact-evidence-graph" };
  }

  if (normalized.includes("graph.snapshot")) {
    return { label: "View evidence graph", href: "#artifact-evidence-graph" };
  }

  if (normalized.includes("findings.snapshot") || normalized.includes("finding")) {
    if (
      context.isRunDetailAvailable &&
      context.primaryFindingId !== undefined &&
      context.primaryFindingId.trim().length > 0
    ) {
      return {
        label: "View findings",
        href: `/architecture/reviews/${enc(context.runId)}/findings/${enc(context.primaryFindingId)}`,
      };
    }

    return { label: "View findings", href: "#artifact-evidence-graph" };
  }

  if (normalized.includes("finalize") || normalized.includes("manifest")) {
    return { label: "Open finalized review", href: manifestHref };
  }

  if (normalized.includes("governance.approval")) {
    return { label: "View approval", href: "#artifact-governance-approval" };
  }

  if (normalized.includes("artifact.bundle") || normalized.includes("deliverable")) {
    return { label: "View deliverables", href: "#demo-preview-deliverables" };
  }

  return null;
}

export function buildDemoPreviewTimelineRows(
  items: PipelineTimelineItem[],
  context: TimelineActionContext,
): DemoPreviewTimelineRow[] {
  return items.map((item) => ({
    eventId: item.eventId,
    title: pipelineEventTypeFriendlyLabel(item.eventType),
    occurredUtc: item.occurredUtc,
    actorUserName: item.actorUserName,
    action: resolveTimelineAction(item.eventType, context),
  }));
}
