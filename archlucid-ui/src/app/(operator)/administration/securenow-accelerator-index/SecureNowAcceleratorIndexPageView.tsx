"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SecureNowAdminSecondCapturePathDeltaStrip } from "@/components/product-line/SecureNowAdminSecondCapturePathDeltaStrip";
import { SecureNowAdminPartialCaptureStrip } from "@/components/product-line/SecureNowAdminPartialCaptureStrip";
import { SecureNowCollectionSetupStatusSection } from "@/components/product-line/SecureNowCollectionSetupStatusSection";
import { SecureNowAcceleratorCatalogFilterChips } from "@/components/product-line/SecureNowAcceleratorCatalogFilterChips";
import { SecureNowAcceleratorFamilyProgressStrip } from "@/components/product-line/SecureNowAcceleratorFamilyProgressStrip";
import { filterSecureNowAcceleratorRowsByCatalogTag } from "@/lib/product-line/securenow-accelerator-catalog-filters";
import type { SecureNowAcceleratorCatalogTag } from "@/lib/product-line/securenow-accelerator-catalog-taxonomy";
import { useSecureNowAcceleratorVisitRecorder } from "@/hooks/use-securenow-accelerator-visit-recorder";
import { SECURENOW_ACCELERATOR_INDEX_PATH } from "@/lib/product-line/securenow-accelerator-index-copy";
import { SecureNowFixtureWorkspaceNotEntitlementLine } from "@/components/product-line/SecureNowFixtureWorkspaceNotEntitlementLine";
import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";
import { SecureNowWorkspaceApiUnreachableNotice } from "@/components/product-line/SecureNowWorkspaceApiUnreachableNotice";
import { useSecureNowLatestSucceededSnapshotId } from "@/hooks/use-securenow-latest-succeeded-snapshot-id";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildSecureNowAcceleratorIndexRows } from "@/lib/product-line/build-securenow-accelerator-index-rows";
import {
  SECURENOW_ACCELERATOR_INDEX_GUARDRAIL,
  SECURENOW_ACCELERATOR_INDEX_HEADING,
  SECURENOW_ACCELERATOR_INDEX_LEAD,
} from "@/lib/product-line/securenow-accelerator-index-copy";
import { SECURENOW_COLLECTION_SETUP_API_UNREACHABLE } from "@/lib/product-line/securenow-workspace-api-unreachable-copy";
import { cn } from "@/lib/utils";

export function SecureNowAcceleratorIndexPageView(): React.JSX.Element {
  const snapshotQuery = useSecureNowLatestSucceededSnapshotId();
  const [catalogTag, setCatalogTag] = useState<SecureNowAcceleratorCatalogTag>("all");
  useSecureNowAcceleratorVisitRecorder({ href: SECURENOW_ACCELERATOR_INDEX_PATH, label: "Accelerator index" });
  const rows = useMemo(() => {
    const built = buildSecureNowAcceleratorIndexRows({ latestSnapshotId: snapshotQuery.latestSnapshotId });
    return filterSecureNowAcceleratorRowsByCatalogTag(built, catalogTag);
  }, [catalogTag, snapshotQuery.latestSnapshotId]);

  return (
    <OperatorPageContainer variant="full" data-testid="securenow-accelerator-index-page">
      <OperatorPageHeader
        title={SECURENOW_ACCELERATOR_INDEX_HEADING}
        subtitle={SECURENOW_ACCELERATOR_INDEX_LEAD}
        claimDiscipline={SECURENOW_ACCELERATOR_INDEX_GUARDRAIL}
        claimDisciplineTestId="securenow-accelerator-index-claim-discipline"
        subtitleTestId="securenow-accelerator-index-lead"
        titleTestId="securenow-accelerator-index-heading"
      />

      <main id="main-content" tabIndex={-1} className="mt-6 max-w-3xl space-y-6">
        <SecureNowAdminPartialCaptureStrip
          testId="securenow-accelerator-index-partial-capture"
          cloudConnectionsTestId="securenow-accelerator-index-partial-capture-cloud-connections"
          extractUploadTestId="securenow-accelerator-index-partial-capture-extract-upload"
        />

        <SecureNowAdminSecondCapturePathDeltaStrip testIdPrefix="securenow-accelerator-index" />

        <SecureNowAcceleratorFamilyProgressStrip />

        <SecureNowAcceleratorCatalogFilterChips activeTag={catalogTag} onTagChange={setCatalogTag} />

        <SecureNowCollectionSetupStatusSection
          testIdPrefix="securenow-accelerator-index"
          sectionId="collection-setup"
        />

        {snapshotQuery.isError ? (
          <SecureNowWorkspaceApiUnreachableNotice
            message={SECURENOW_COLLECTION_SETUP_API_UNREACHABLE}
            testId="securenow-accelerator-index-snapshot-list-unreachable"
          />
        ) : null}

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
          headingId="securenow-accelerator-index-table-heading"
          tableAriaLabel="SecureNow accelerator destinations"
          linkTestIdPrefix="securenow-accelerator-index-link"
        />

        <SecureNowFixtureWorkspaceNotEntitlementLine />

        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-accelerator-index-sources">
          <span className="font-medium text-al-text-primary">Sources:</span> Labeled fixture walks and admin deep links
          only — not customer accelerators or sealed outcomes until Reader capture succeeds.
        </p>

        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href="/administration">
            Administration hub
          </Link>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href="/">
            Home
          </Link>
        </p>
      </main>
    </OperatorPageContainer>
  );
}

