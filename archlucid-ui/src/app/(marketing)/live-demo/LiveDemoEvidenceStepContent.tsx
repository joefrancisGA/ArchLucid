import { Button } from "@/components/ui/button";
import {
  LIVE_DEMO_INSPECT_ACTION_EVIDENCE,
  LIVE_DEMO_KEY_TAKEAWAY_HEADING,
} from "@/lib/live-demo-page-copy";
import { resolveLiveDemoInspectHref } from "@/lib/live-demo-public-links";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { cn } from "@/lib/utils";

import { LiveDemoEvidenceChainPreview } from "./LiveDemoEvidenceChainPreview";
import { LiveDemoTrackedLink } from "./LiveDemoTrackedLink";

type LiveDemoEvidenceStepContentProps = {
  readonly payload: DemoCommitPagePreviewResponse;
  readonly runId: string;
  readonly manifestId: string | null;
  readonly operatorDeepLinksAvailable: boolean;
  readonly keyTakeaway: string;
};

export function LiveDemoEvidenceStepContent(props: LiveDemoEvidenceStepContentProps) {
  const citations = Array.isArray(props.payload.runExplanation?.citations) ? props.payload.runExplanation.citations : [];
  const inspectHref = resolveLiveDemoInspectHref(
    "evidence-graph",
    props.runId,
    props.manifestId,
    props.operatorDeepLinksAvailable,
  );

  return (
    <article data-testid="live-demo-step-evidence">
      <h2 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}>
        Evidence graph
      </h2>
      <p className={cn("m-0 mt-3 max-w-3xl text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
        Trace how review conclusions connect to captured context, graph evidence, and finalized findings in this sample
        package.
      </p>

      <div className="mt-4">
        <LiveDemoEvidenceChainPreview payload={props.payload} />
      </div>

      {citations.length > 0 ? (
        <ul className="m-0 mt-4 list-disc space-y-2 pl-5" aria-label="Supporting citations">
          {citations.slice(0, 6).map((citation) => (
            <li key={`${citation.kind}-${citation.id}`} className={cn("text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
              {citation.label}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}>
          {LIVE_DEMO_KEY_TAKEAWAY_HEADING}
        </p>
        <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>{props.keyTakeaway}</p>
      </div>

      <div className="mt-4">
        <Button asChild variant="outline" data-testid="live-demo-inspect-evidence">
          <LiveDemoTrackedLink href={inspectHref} trackKind="artifact" trackValue="evidence-graph">
            {LIVE_DEMO_INSPECT_ACTION_EVIDENCE}
          </LiveDemoTrackedLink>
        </Button>
      </div>
    </article>
  );
}
