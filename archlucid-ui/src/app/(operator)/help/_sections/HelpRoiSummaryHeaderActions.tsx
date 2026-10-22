"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { ROI_SUMMARY_HELP_PRIMARY_ACTION } from "@/lib/roi-summary-help-guide-content";

/** Header actions for `/help/roi-summary` (HRO). */
export function HelpRoiSummaryHeaderActions(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid="help-roi-summary-header-actions">
        <Button asChild size="sm" variant="primary" data-testid="help-roi-summary-header-primary-cta">
          <Link href={ROI_SUMMARY_HELP_PRIMARY_ACTION.href}>
            {ROI_SUMMARY_HELP_PRIMARY_ACTION.label}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-roi-summary-header-actions">
      <PageContextualHelpButton />
    </div>
  );
}
