"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  NOTIFICATIONS_HELP_PRIMARY_ACTION,
} from "@/lib/notifications-help-guide-content";

/** Header actions for `/help/notifications` (HEN). */
export function HelpNotificationsHeaderActions(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid="help-notifications-header-actions">
        <Button asChild size="sm" variant="primary" data-testid="help-notifications-header-primary-cta">
          <Link href={NOTIFICATIONS_HELP_PRIMARY_ACTION.href}>
            {NOTIFICATIONS_HELP_PRIMARY_ACTION.label}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-notifications-header-actions">
      <PageContextualHelpButton />
    </div>
  );
}
