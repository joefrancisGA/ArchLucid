"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  IMPACT_PREVIEW_ADVISORY_HREF,
  IMPACT_PREVIEW_GOVERNANCE_HREF,
  IMPACT_PREVIEW_RESULT_ACTION_ADVISORY,
  IMPACT_PREVIEW_RESULT_ACTION_EXPORT,
  IMPACT_PREVIEW_RESULT_ACTION_GOVERNANCE,
  IMPACT_PREVIEW_RESULT_ACTION_SAVE,
  IMPACT_PREVIEW_SAVE_UNAVAILABLE_HINT,
} from "@/lib/impact-preview-page-copy";
import { buildEvolutionSimulationReportFileUrl } from "@/lib/evolution-simulation-report-urls";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";

const IMPACT_PREVIEW_SAVE_DISABLED_REASON: WhyDisabledCtaReason = {
  kind: "policy",
  message: IMPACT_PREVIEW_SAVE_UNAVAILABLE_HINT,
};

export type ImpactPreviewResultActionsProps = {
  readonly selectedCandidateId: string;
};

export function ImpactPreviewResultActions(props: ImpactPreviewResultActionsProps): React.JSX.Element {
  const exportUrl = buildEvolutionSimulationReportFileUrl(props.selectedCandidateId, "markdown");

  return (
    <div className="flex flex-col gap-2" data-testid="impact-preview-result-actions">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled aria-describedby="impact-preview-save-disabled-hint">
          {IMPACT_PREVIEW_RESULT_ACTION_SAVE}
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={IMPACT_PREVIEW_ADVISORY_HREF}>{IMPACT_PREVIEW_RESULT_ACTION_ADVISORY}</Link>
        </Button>
        <Button asChild size="sm">
          <Link href={IMPACT_PREVIEW_GOVERNANCE_HREF}>{IMPACT_PREVIEW_RESULT_ACTION_GOVERNANCE}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={exportUrl} download>
            {IMPACT_PREVIEW_RESULT_ACTION_EXPORT}
          </a>
        </Button>
      </div>
      <WhyDisabledCtaHint
        id="impact-preview-save-disabled-hint"
        reason={IMPACT_PREVIEW_SAVE_DISABLED_REASON}
        testId="impact-preview-save-disabled-hint"
      />
    </div>
  );
}
