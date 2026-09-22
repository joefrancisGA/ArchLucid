"use client";

import { cn } from "@/lib/utils";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
    <p
      className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
      data-testid={SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION_TEST_ID}
    >
      {SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION}
    </p>
  );
}
