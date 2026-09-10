"use client";

import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { ADVISORY_SCANS_CLAIM_DISCIPLINE } from "@/lib/advisory-scans-evidence-copy";

import { AdvisoryScansClaimOrientationStrip } from "./AdvisoryScansClaimOrientationStrip";

/** Buyer default: mount claim discipline and Sources above primary scans workspace (ADT). */
export function AdvisoryScansBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="advisory-scans-orientation-top">
      <PageHeaderClaimDiscipline
        text={ADVISORY_SCANS_CLAIM_DISCIPLINE}
        testId="advisory-scans-claim-discipline"
        className="max-w-prose text-left"
      />
      <AdvisoryScansClaimOrientationStrip />
    </div>
  );
}
