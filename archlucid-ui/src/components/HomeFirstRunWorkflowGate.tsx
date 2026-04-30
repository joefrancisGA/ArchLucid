"use client";

import { OperatorFirstRunWorkflowPanel } from "@/components/OperatorFirstRunWorkflowPanel";
import { isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";

/**
 * Wraps {@link OperatorFirstRunWorkflowPanel}: in buyer-safe demo builds, the right rail elevates reviewing the
 * completed Claims Intake spine over pure first-run language.
 */
export function HomeFirstRunWorkflowGate() {
  return <OperatorFirstRunWorkflowPanel exploreCompletedOutput={isBuyerSafeDemoMarketingChromeEnv()} />;
}
