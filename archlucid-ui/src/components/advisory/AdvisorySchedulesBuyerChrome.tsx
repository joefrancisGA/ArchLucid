"use client";

import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { ADVISORY_SCHEDULES_CLAIM_DISCIPLINE } from "@/lib/advisory-schedules-evidence-copy";

import { AdvisorySchedulesSourcesOrientationStrip } from "./AdvisorySchedulesSourcesOrientationStrip";

/** Buyer default: mount claim discipline and Sources follow-ups after primary advisory schedules workspace (AD). */
export function AdvisorySchedulesBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <>
      <PageHeaderClaimDiscipline
        text={ADVISORY_SCHEDULES_CLAIM_DISCIPLINE}
        testId="advisory-schedules-claim-discipline"
        className="max-w-prose text-left"
      />
      <AdvisorySchedulesSourcesOrientationStrip />
    </>
  );
}
