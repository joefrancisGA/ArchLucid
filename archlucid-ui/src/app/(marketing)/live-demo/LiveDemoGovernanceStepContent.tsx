import { Button } from "@/components/ui/button";
import {
  LIVE_DEMO_GOVERNANCE_APPROVAL_NOTE,
  LIVE_DEMO_INSPECT_ACTION_GOVERNANCE,
  LIVE_DEMO_KEY_TAKEAWAY_HEADING,
} from "@/lib/live-demo-page-copy";
import { resolveLiveDemoInspectHref } from "@/lib/live-demo-public-links";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { cn } from "@/lib/utils";

import { LiveDemoTrackedLink } from "./LiveDemoTrackedLink";

type LiveDemoGovernanceStepContentProps = {
  readonly payload: DemoCommitPagePreviewResponse;
  readonly runId: string;
  readonly manifestId: string | null;
  readonly operatorDeepLinksAvailable: boolean;
  readonly keyTakeaway: string;
};

export function LiveDemoGovernanceStepContent(props: LiveDemoGovernanceStepContentProps) {
  const manifest = props.payload.manifest;
  const inspectHref = resolveLiveDemoInspectHref(
    "governance",
    props.runId,
    props.manifestId,
    props.operatorDeepLinksAvailable,
  );

  return (
    <article data-testid="live-demo-step-governance">
      <h2 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}>
        Governance approval
      </h2>
      <p className={cn("m-0 mt-3 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
        Governance approval recorded with monitored conditions for PHI handling and intake continuity.
      </p>

      {manifest ? (
        <dl className="m-0 mt-4 grid gap-3 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 sm:grid-cols-2">
          <div>
            <dt className={cn("text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>Decisions recorded</dt>
            <dd className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>
              {manifest.decisionCount}
            </dd>
          </div>
          <div>
            <dt className={cn("text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>Approval status</dt>
            <dd className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>
              Recorded with monitored follow-up
            </dd>
          </div>
          <div>
            <dt className={cn("text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>Monitored risks</dt>
            <dd className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>
              {manifest.warningCount}
            </dd>
          </div>
          <div>
            <dt className={cn("text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>Unresolved issues</dt>
            <dd className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>
              {manifest.unresolvedIssueCount}
            </dd>
          </div>
        </dl>
      ) : null}

      <p className={cn("m-0 mt-4 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
        {LIVE_DEMO_GOVERNANCE_APPROVAL_NOTE}
      </p>

      <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}>
          {LIVE_DEMO_KEY_TAKEAWAY_HEADING}
        </p>
        <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>{props.keyTakeaway}</p>
      </div>

      <div className="mt-4">
        <Button asChild variant="outline" data-testid="live-demo-inspect-governance">
          <LiveDemoTrackedLink href={inspectHref} trackKind="artifact" trackValue="governance">
            {LIVE_DEMO_INSPECT_ACTION_GOVERNANCE}
          </LiveDemoTrackedLink>
        </Button>
      </div>
    </article>
  );
}
