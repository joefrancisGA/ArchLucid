"use client";

import type { ReactElement } from "react";

import { ReviewPackageShareWhenToSharePreview } from "@/components/ReviewPackageShareWhenToSharePreview";
import { ReviewSealedIndicatorChip } from "@/components/reviews/ReviewSealedIndicatorChip";
import { ExportDeliverableDialog } from "@/components/usability/ExportDeliverableDialog";
import { PersistentSponsorEmailStrip } from "@/components/usability/PersistentSponsorEmailStrip";
import { ShareableReviewLinkButton } from "@/components/usability/ShareableReviewLinkButton";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type RunDetailReviewPackageShareRowProps = {
  readonly runId: string;
  readonly manifestId: string;
  readonly completedUtc: string | null | undefined;
};

/** Post-finalize share/export affordances — interaction-gated off sync First Load JS (TB-2142). */
export function RunDetailReviewPackageShareRow(props: RunDetailReviewPackageShareRowProps): ReactElement {
  return (
    <>
      <PersistentSponsorEmailStrip runId={props.runId} isCommitted />
      <ReviewPackageShareWhenToSharePreview />
      <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
        <ExportDeliverableDialog runId={props.runId} manifestId={props.manifestId} />
        <ShareableReviewLinkButton runId={props.runId} isCommitted manifestVersion={props.manifestId} />
        {props.completedUtc ? <ReviewSealedIndicatorChip sealedUtc={props.completedUtc} /> : null}
      </div>
    </>
  );
}
