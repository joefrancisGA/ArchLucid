import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { RunDetailAiReadinessGateCard } from "@/components/runs/RunDetailAiReadinessGateCard";
import { BUYER_SPONSOR_BRIEFING_PACKAGE_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  EmailRunToSponsorBannerDeferred,
  PilotRoiValidationHandoffClientDeferred,
} from "./run-detail-sponsor-briefing-deferred-chunks";

type RunDetailSponsorBriefingSectionProps = {
  readonly runId: string;
  readonly manifestId: string;
  readonly curatedSampleRun: boolean;
  readonly buyerPolishedArtifactTable: boolean;
  readonly sponsorDocxAvailable: boolean;
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

export type RunDetailSponsorBriefingSectionOptions = {
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

/** Inputs already on the first-screen run-detail model — no below-fold deferred fetch required. */
export type RunDetailSponsorBriefingModelSlice = {
  readonly showPilotScorecardPackageCta: boolean;
  readonly manifestId: string | null | undefined;
  readonly routeRunId: string;
  readonly usedStaticDemoRun: boolean;
  readonly buyerPolishedArtifactTable: boolean;
  readonly artifacts: readonly { readonly artifactId?: string | null }[];
};

/**
 * Time-to-Value / sponsor PDF CTA. Kept outside {@link RunDetailBelowFoldSections}' deferred await
 * so `#sponsor-handoff-extended` mounts when the Review package tab opens even if pipeline timeline fetch is slow.
 */
export function resolveRunDetailSponsorBriefingSection(
  model: RunDetailSponsorBriefingModelSlice,
  options?: RunDetailSponsorBriefingSectionOptions,
): ReactElement | null {
  const manifestId = model.manifestId?.trim() ?? "";

  if (!model.showPilotScorecardPackageCta || manifestId.length === 0) {
    return null;
  }

  return (
    <RunDetailSponsorBriefingSection
      runId={model.routeRunId}
      manifestId={manifestId}
      curatedSampleRun={model.usedStaticDemoRun}
      buyerPolishedArtifactTable={model.buyerPolishedArtifactTable}
      sponsorDocxAvailable={manifestId.length > 0}
      pagePrimaryOwnedElsewhere={options?.pagePrimaryOwnedElsewhere}
    />
  );
}

export function RunDetailSponsorBriefingSection(props: RunDetailSponsorBriefingSectionProps): ReactElement {
  const {
    runId,
    manifestId,
    curatedSampleRun,
    buyerPolishedArtifactTable,
    sponsorDocxAvailable,
    pagePrimaryOwnedElsewhere,
  } = props;

  const deliverables = (
    <>
      <PilotRoiValidationHandoffClientDeferred runId={runId} curatedSampleRun={curatedSampleRun} className="mb-4" />
      <RunDetailAiReadinessGateCard runId={runId} manifestId={manifestId} />
      <EmailRunToSponsorBannerDeferred
        runId={runId}
        manifestId={manifestId}
        curatedSampleRun={curatedSampleRun}
        sponsorDocxAvailable={sponsorDocxAvailable}
        pagePrimaryOwnedElsewhere={pagePrimaryOwnedElsewhere}
      />
    </>
  );

  if (buyerPolishedArtifactTable) {
    return (
      <CollapsibleSection title={BUYER_SPONSOR_BRIEFING_PACKAGE_LABEL} defaultOpen>
        <div id="sponsor-handoff-extended" className="scroll-mt-24">
          {deliverables}
        </div>
      </CollapsibleSection>
    );
  }

  return <div id="sponsor-handoff-extended" className="scroll-mt-24">{deliverables}</div>;
}
