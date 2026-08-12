import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { RunDetailAiReadinessGateCard } from "@/components/runs/RunDetailAiReadinessGateCard";
import { BUYER_EXECUTIVE_BRIEFING_PACKAGE_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const EmailRunToSponsorBanner = dynamic(
  () => import("@/components/EmailRunToSponsorBanner").then((module) => module.EmailRunToSponsorBanner),
  {
    loading: () => (
      <div
        className={cn("rounded-md border border-neutral-200 p-4 text-al-text-secondary dark:border-neutral-700", OPERATOR_TYPOGRAPHY.body)}
        role="status"
        aria-live="polite"
      >
        Loading sponsor briefing…
      </div>
    ),
  },
);

const PilotRoiValidationHandoffClient = dynamic(
  () =>
    import("@/components/pilots/PilotRoiValidationHandoffCard").then(
      (module) => module.PilotRoiValidationHandoffClient,
    ),
  {
    loading: () => (
      <div
        className={cn("rounded-md border border-neutral-200 p-4 text-al-text-secondary dark:border-neutral-700", OPERATOR_TYPOGRAPHY.body)}
        role="status"
        aria-live="polite"
      >
        Loading ROI validation handoff…
      </div>
    ),
  },
);

type RunDetailSponsorBriefingSectionProps = {
  readonly runId: string;
  readonly manifestId: string;
  readonly curatedSampleRun: boolean;
  readonly buyerPolishedArtifactTable: boolean;
  readonly sponsorDocxAvailable: boolean;
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
    />
  );
}

export function RunDetailSponsorBriefingSection(props: RunDetailSponsorBriefingSectionProps): ReactElement {
  const { runId, manifestId, curatedSampleRun, buyerPolishedArtifactTable, sponsorDocxAvailable } = props;

  const deliverables = (
    <>
      <PilotRoiValidationHandoffClient runId={runId} curatedSampleRun={curatedSampleRun} className="mb-4" />
      <RunDetailAiReadinessGateCard runId={runId} manifestId={manifestId} />
      <EmailRunToSponsorBanner
        runId={runId}
        manifestId={manifestId}
        curatedSampleRun={curatedSampleRun}
        sponsorDocxAvailable={sponsorDocxAvailable}
      />
    </>
  );

  if (buyerPolishedArtifactTable) {
    return (
      <CollapsibleSection title={BUYER_EXECUTIVE_BRIEFING_PACKAGE_LABEL} defaultOpen>
        <div id="sponsor-handoff-extended" className="scroll-mt-24">
          {deliverables}
        </div>
      </CollapsibleSection>
    );
  }

  return <div id="sponsor-handoff-extended" className="scroll-mt-24">{deliverables}</div>;
}
