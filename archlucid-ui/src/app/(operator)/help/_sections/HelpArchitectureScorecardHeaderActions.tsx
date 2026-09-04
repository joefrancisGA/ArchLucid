"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION } from "@/lib/architecture-scorecard-help-guide-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Header actions for `/help/architecture-scorecard` (HER). */
export function HelpArchitectureScorecardHeaderActions(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid="help-architecture-scorecard-header-actions">
        <Button asChild size="sm" variant="primary" data-testid="help-architecture-scorecard-header-primary-cta">
          <Link href={ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION.href}>
            {ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION.label}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-architecture-scorecard-header-actions">
      <PageContextualHelpButton />
    </div>
  );
}
