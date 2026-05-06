"use client";

import { OperatorFirstRunWorkflowPanel } from "@/components/OperatorFirstRunWorkflowPanel";
import { isBuyerPolishedOperatorShellEnv, isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";

/**
 * Wraps {@link OperatorFirstRunWorkflowPanel}: in buyer-safe demo builds, the right rail elevates reviewing the
 * completed Claims Intake spine over pure first-run language. Hidden entirely in buyer-polished operator shell
 * to reduce CTA noise — the sample review card on the main column is sufficient.
 */
export function HomeFirstRunWorkflowGate() {
  if (isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <OperatorFirstRunWorkflowPanel exploreCompletedOutput={isBuyerSafeDemoMarketingChromeEnv()} />;
}
