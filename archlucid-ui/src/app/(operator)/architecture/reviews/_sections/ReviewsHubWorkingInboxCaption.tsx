"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION,
  SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION_TEST_ID,
} from "@/lib/system-not-job-reviews-hub-inbox-copy";

/** SN-011 — Working operator shell inbox caption (buyer shell uses Sources orientation strip). */
export function ReviewsHubWorkingInboxCaption(): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (!isWorkingMode || buyerPolishedShell) {
    return null;
  }

  return (
    <PageHeaderClaimDiscipline
      text={SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION}
      testId={SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION_TEST_ID}
      className="mt-0 w-full max-w-3xl"
    />
  );
}
