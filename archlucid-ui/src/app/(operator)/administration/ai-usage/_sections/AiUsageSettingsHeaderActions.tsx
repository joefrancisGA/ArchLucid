"use client";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { AI_USAGE_HELP_TOPIC_LABEL } from "@/lib/ai-usage-settings-evidence-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Header actions for `/administration/ai-usage` (ADI). */
export function AiUsageSettingsHeaderActions(): React.JSX.Element | null {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return null;
  }

  return <PageContextualHelpButton triggerText={AI_USAGE_HELP_TOPIC_LABEL} />;
}
