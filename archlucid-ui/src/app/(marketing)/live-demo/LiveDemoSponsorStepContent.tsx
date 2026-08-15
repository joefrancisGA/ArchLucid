import { ExplanationEvidenceBasisBadges } from "@/components/ExplanationEvidenceBasisBadges";
import { Button } from "@/components/ui/button";
import { buildDemoPreviewConditionsText } from "@/lib/demo-preview-present";
import {
  DEMO_PREVIEW_CONDITIONS_LABEL,
  DEMO_PREVIEW_EVIDENCE_BASIS_LABEL,
  DEMO_PREVIEW_EVIDENCE_BASIS_TEXT,
  DEMO_PREVIEW_SPONSOR_CONCLUSION_HEADING,
  DEMO_PREVIEW_RECOMMENDATION_LABEL,
  DEMO_PREVIEW_SUPPORTING_EVIDENCE_LABEL,
} from "@/lib/demo-preview-page-copy";
import {
  LIVE_DEMO_INSPECT_ACTION_SPONSOR,
  LIVE_DEMO_KEY_TAKEAWAY_HEADING,
} from "@/lib/live-demo-page-copy";
import { resolveLiveDemoInspectHref } from "@/lib/live-demo-public-links";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { isDeterministicExplanationFallback } from "@/types/explanation";
import { cn } from "@/lib/utils";

import { LiveDemoTrackedLink } from "./LiveDemoTrackedLink";

type LiveDemoSponsorStepContentProps = {
  readonly payload: DemoCommitPagePreviewResponse;
  readonly runId: string;
  readonly manifestId: string | null;
  readonly operatorDeepLinksAvailable: boolean;
  readonly keyTakeaway: string;
};

export function LiveDemoSponsorStepContent(props: LiveDemoSponsorStepContentProps) {
  const runExplanation = props.payload.runExplanation;
  const citationCount = Array.isArray(runExplanation?.citations) ? runExplanation.citations.length : 0;
  const recommendation =
    runExplanation?.overallAssessment?.trim() ??
    "Proceed with claims intake modernization under monitored PHI-minimization controls.";
  const conditions = buildDemoPreviewConditionsText(runExplanation?.themeSummaries);
  const inspectHref = resolveLiveDemoInspectHref(
    "sponsor",
    props.runId,
    props.manifestId,
    props.operatorDeepLinksAvailable,
  );

  return (
    <article data-testid="live-demo-step-sponsor">
      <h2 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}>
        {DEMO_PREVIEW_SPONSOR_CONCLUSION_HEADING}
      </h2>

      <div className="mt-4 space-y-4 rounded-xl border border-neutral-200 bg-al-surface-raised p-5 dark:border-neutral-800">
        <div>
          <p className={cn("m-0 font-semibold text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.cardTitle)}>
            {DEMO_PREVIEW_RECOMMENDATION_LABEL}
          </p>
          <p className={cn("m-0 mt-1 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>{recommendation}</p>
        </div>

        <div>
          <p className={cn("m-0 font-semibold text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.cardTitle)}>
            {DEMO_PREVIEW_EVIDENCE_BASIS_LABEL}
          </p>
          <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
            {DEMO_PREVIEW_EVIDENCE_BASIS_TEXT}
          </p>
        </div>

        <div>
          <p className={cn("m-0 font-semibold text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.cardTitle)}>
            {DEMO_PREVIEW_CONDITIONS_LABEL}
          </p>
          <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>{conditions}</p>
        </div>

        <div>
          <p className={cn("m-0 font-semibold text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.cardTitle)}>
            {DEMO_PREVIEW_SUPPORTING_EVIDENCE_LABEL}
          </p>
          <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
            {citationCount} citations · Evidence-backed ·{" "}
            {props.payload.manifest ? manifestStatusForDisplay(props.payload.manifest.status) : "Finalized"} record
          </p>
          <div className="mt-3">
            <ExplanationEvidenceBasisBadges
              citationCount={citationCount}
              faithfulnessSupportRatio={runExplanation?.faithfulnessSupportRatio}
              deterministicFallbackUsed={runExplanation ? isDeterministicExplanationFallback(runExplanation) : false}
              compact
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}>
          {LIVE_DEMO_KEY_TAKEAWAY_HEADING}
        </p>
        <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>{props.keyTakeaway}</p>
      </div>

      <div className="mt-4">
        <Button asChild variant="outline" data-testid="live-demo-inspect-sponsor">
          <LiveDemoTrackedLink href={inspectHref} trackKind="artifact" trackValue="sponsor">
            {LIVE_DEMO_INSPECT_ACTION_SPONSOR}
          </LiveDemoTrackedLink>
        </Button>
      </div>
    </article>
  );
}
