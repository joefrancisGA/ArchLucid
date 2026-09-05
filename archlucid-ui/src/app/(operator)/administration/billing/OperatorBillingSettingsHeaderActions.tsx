"use client";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_BILLING_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/operator/operator-billing-settings-evidence-copy";

/** Header actions for `/administration/billing` (ABI). */
export function OperatorBillingSettingsHeaderActions(): React.JSX.Element | null {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return null;
  }

  return <PageContextualHelpButton triggerText={OPERATOR_BILLING_SETTINGS_HELP_TOPIC_LABEL} />;
}
