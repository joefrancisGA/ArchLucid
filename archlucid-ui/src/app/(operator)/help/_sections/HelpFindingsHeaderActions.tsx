"use client";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Header actions for `/help/findings` (HFX). */
export function HelpFindingsHeaderActions(): React.JSX.Element | null {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-findings-header-actions">
      <PageContextualHelpButton />
    </div>
  );
}
