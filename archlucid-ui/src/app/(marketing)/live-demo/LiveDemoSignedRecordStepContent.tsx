import { Button } from "@/components/ui/button";
import {
  LIVE_DEMO_INSPECT_ACTION_SIGNED,
  LIVE_DEMO_KEY_TAKEAWAY_HEADING,
} from "@/lib/live-demo-page-copy";
import { resolveLiveDemoInspectHref } from "@/lib/live-demo-public-links";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { cn } from "@/lib/utils";

import { LiveDemoTrackedLink } from "./LiveDemoTrackedLink";

type LiveDemoSignedRecordStepContentProps = {
  readonly payload: DemoCommitPagePreviewResponse;
  readonly runId: string;
  readonly manifestId: string | null;
  readonly operatorDeepLinksAvailable: boolean;
  readonly keyTakeaway: string;
};

function formatDate(iso: string | undefined): string {
  if (typeof iso !== "string" || iso.trim().length === 0) {
    return "—";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function LiveDemoSignedRecordStepContent(props: LiveDemoSignedRecordStepContentProps) {
  const manifest = props.payload.manifest;
  const inspectHref = resolveLiveDemoInspectHref(
    "signed-record",
    props.runId,
    props.manifestId,
    props.operatorDeepLinksAvailable,
  );
  const citationCount = Array.isArray(props.payload.runExplanation?.citations)
    ? props.payload.runExplanation.citations.length
    : 0;

  return (
    <article data-testid="live-demo-step-signed-record">
      <h2 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}>
        Sealed review record
      </h2>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        {manifest?.operatorSummary ? (
          <p className={cn("m-0 max-w-3xl text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
            {manifest.operatorSummary}
          </p>
        ) : null}
        {manifest ? (
          <dl className="m-0 mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className={cn("text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>Status</dt>
              <dd className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>
                {manifestStatusForDisplay(manifest.status)}
              </dd>
            </div>
            <div>
              <dt className={cn("text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>Finalized</dt>
              <dd className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>
                {formatDate(manifest.createdUtc)}
              </dd>
            </div>
            <div>
              <dt className={cn("text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>Policy coverage</dt>
              <dd className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>
                {policyPackBuyerLabel(manifest.ruleSetId ?? "", manifest.ruleSetVersion ?? "")}
              </dd>
            </div>
            <div>
              <dt className={cn("text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>Evidence count</dt>
              <dd className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>
                {citationCount}
              </dd>
            </div>
            <div>
              <dt className={cn("text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>Unresolved conditions</dt>
              <dd className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>
                {manifest.unresolvedIssueCount}
              </dd>
            </div>
            <div>
              <dt className={cn("text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>Integrity status</dt>
              <dd className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>
                Record retained — not a cryptographic signature claim
              </dd>
            </div>
          </dl>
        ) : null}
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}>
          {LIVE_DEMO_KEY_TAKEAWAY_HEADING}
        </p>
        <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>{props.keyTakeaway}</p>
      </div>

      <div className="mt-4">
        <Button asChild variant="outline" data-testid="live-demo-inspect-signed-record">
          <LiveDemoTrackedLink href={inspectHref} trackKind="artifact" trackValue="signed-record">
            {LIVE_DEMO_INSPECT_ACTION_SIGNED}
          </LiveDemoTrackedLink>
        </Button>
      </div>
    </article>
  );
}
