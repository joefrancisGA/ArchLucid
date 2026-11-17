"use client";

import type { ReactElement } from "react";

import { CompareGovernanceDiffPanel } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareGovernanceDiffPanel";
import {
  useCompareGovernanceDiff,
  type CompareGovernanceDiffLoadState,
} from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareGovernanceDiff";
import { useComparePolicyPackCloudMismatch } from "@/app/(operator)/insights/compare-two-reviews/_sections/useComparePolicyPackCloudMismatch";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { policyPacksPathForProductLine } from "@/lib/product-line/securenow-compliance-routes";

export type CompareGovernanceDiffSectionProps = {
  readonly baselineRunId: string | null;
  readonly targetRunId: string | null;
  readonly preloaded?: CompareGovernanceDiffLoadState;
  readonly baselineRequestId?: string | null;
  readonly targetRequestId?: string | null;
};

/** Client section — soft-loads governance diff without blocking structured compare render. */
export function CompareGovernanceDiffSection(props: CompareGovernanceDiffSectionProps): ReactElement {
  const { productLine } = useProductLine();
  const internal = useCompareGovernanceDiff(
    props.preloaded !== undefined ? null : props.baselineRunId,
    props.preloaded !== undefined ? null : props.targetRunId,
  );
  const { loading, view, softFailureMessage } = props.preloaded ?? internal;
  const cloudMismatch = useComparePolicyPackCloudMismatch(
    props.baselineRequestId,
    props.targetRequestId,
    view?.baselineManifest,
    view?.targetManifest,
  );

  return (
    <CompareGovernanceDiffPanel
      view={view}
      loading={loading}
      softFailureMessage={softFailureMessage}
      baselineCloudMismatchDetail={cloudMismatch.baselineDetail}
      targetCloudMismatchDetail={cloudMismatch.targetDetail}
      targetRunId={props.targetRunId}
      policyPacksHubPath={policyPacksPathForProductLine(productLine)}
    />
  );
}
