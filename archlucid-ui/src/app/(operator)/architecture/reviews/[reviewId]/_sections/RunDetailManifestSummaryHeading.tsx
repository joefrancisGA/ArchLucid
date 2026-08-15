"use client";

import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { useGovernanceMode } from "@/hooks/use-governance-mode";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

type RunDetailManifestSummaryHeadingProps = {
  readonly buyerPolishedShell: boolean;
};

export function RunDetailManifestSummaryHeading(props: RunDetailManifestSummaryHeadingProps) {
  const { buyerPolishedShell } = props;
  const { vocabulary } = useGovernanceMode();

  if (buyerPolishedShell) {
    return <h3 className={runDetailSectionHeadingClass}>Sealed review record</h3>;
  }

  return (
    <h3 className={runDetailSectionHeadingClass}>
      {vocabulary.manifestSummaryHeading} (
      <GlossaryTooltip termKey="architecture_manifest">review record</GlossaryTooltip>)
    </h3>
  );
}
