"use client";

import { useMemo } from "react";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { useSecureNowLatestSucceededSnapshotId } from "@/hooks/use-securenow-latest-succeeded-snapshot-id";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildSecureNowAcceleratorIndexRows } from "@/lib/product-line/build-securenow-accelerator-index-rows";
import {
  SECURENOW_ACCELERATOR_INDEX_GUARDRAIL,
  SECURENOW_ACCELERATOR_INDEX_HEADING,
  SECURENOW_ACCELERATOR_INDEX_LEAD,
} from "@/lib/product-line/securenow-accelerator-index-copy";
import { cn } from "@/lib/utils";

export function SecureNowAcceleratorIndexPageView(): React.JSX.Element {
  const snapshotQuery = useSecureNowLatestSucceededSnapshotId();
  const rows = useMemo(
    () => buildSecureNowAcceleratorIndexRows({ latestSnapshotId: snapshotQuery.latestSnapshotId }),
    [snapshotQuery.latestSnapshotId],
  );

  return (
    <OperatorPageContainer variant="full" data-testid="securenow-accelerator-index-page">
      <OperatorPageHeader title={SECURENOW_ACCELERATOR_INDEX_HEADING} subtitle={SECURENOW_ACCELERATOR_INDEX_LEAD} />

      <main className="mt-6 max-w-3xl space-y-6">
        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_ACCELERATOR_INDEX_GUARDRAIL}</p>
        {snapshotQuery.isPending ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-accelerator-index-loading">
            Loading capture status…
          </p>
        ) : null}
        <SecureNowHomeDestinationSection
          heading="Accelerators"
          lead="Each row is synthetic until capture produces stored paths."
          rows={rows}
          sectionTestId="securenow-accelerator-index-table"
          headingId="securenow-accelerator-index-heading"
          tableAriaLabel="SecureNow accelerator destinations"
          linkTestIdPrefix="securenow-accelerator-index-link"
        />
      </main>
    </OperatorPageContainer>
  );
}
