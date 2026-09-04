"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { MODEL_GOVERNANCE_HELP_PRIMARY_ACTION } from "@/lib/model-governance-help-guide-content";

/** Header actions for `/help/model-governance` (HMO). */
export function HelpModelGovernanceHeaderActions(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid="help-model-governance-header-actions">
        <Button asChild size="sm" variant="primary" data-testid="help-model-governance-header-primary-cta">
          <Link href={MODEL_GOVERNANCE_HELP_PRIMARY_ACTION.href}>
            {MODEL_GOVERNANCE_HELP_PRIMARY_ACTION.label}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-model-governance-header-actions">
      <PageContextualHelpButton />
    </div>
  );
}
