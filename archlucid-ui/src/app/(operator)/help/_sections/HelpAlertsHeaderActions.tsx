"use client";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Header actions for `/help/alerts` (HA). */
export function HelpAlertsHeaderActions(): React.JSX.Element | null {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-alerts-header-actions">
      <PageContextualHelpButton />
    </div>
  );
}
