"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  IMPACT_PREVIEW_ADVISORY_HREF,
  IMPACT_PREVIEW_GOVERNANCE_HREF,
  IMPACT_PREVIEW_RESULT_ACTION_ADVISORY,
  IMPACT_PREVIEW_RESULT_ACTION_EXPORT,
  IMPACT_PREVIEW_RESULT_ACTION_GOVERNANCE,
  IMPACT_PREVIEW_RESULT_ACTION_SAVE,
} from "@/lib/impact-preview-page-copy";
import { buildEvolutionSimulationReportFileUrl } from "@/lib/evolution-simulation-report-urls";

export type ImpactPreviewResultActionsProps = {
  readonly selectedCandidateId: string;
};

export function ImpactPreviewResultActions(props: ImpactPreviewResultActionsProps): React.JSX.Element {
  const exportUrl = buildEvolutionSimulationReportFileUrl(props.selectedCandidateId, "markdown");

  return (
    <div className="flex flex-wrap gap-2" data-testid="impact-preview-result-actions">
      <Button type="button" variant="outline" size="sm" disabled title="Saving impact previews is not available in this release.">
        {IMPACT_PREVIEW_RESULT_ACTION_SAVE}
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={IMPACT_PREVIEW_ADVISORY_HREF}>{IMPACT_PREVIEW_RESULT_ACTION_ADVISORY}</Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={IMPACT_PREVIEW_GOVERNANCE_HREF}>{IMPACT_PREVIEW_RESULT_ACTION_GOVERNANCE}</Link>
      </Button>
      <Button asChild size="sm">
        <a href={exportUrl} download>
          {IMPACT_PREVIEW_RESULT_ACTION_EXPORT}
        </a>
      </Button>
    </div>
  );
}
