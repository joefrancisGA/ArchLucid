import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CONNECTION_STATUS_HELP_PRIMARY_ACTION } from "@/lib/connection-status-help-guide-content";

/** Primary destination for `/help/connection-status` — single header CTA (HCO). */
export function HelpConnectionStatusHeaderActions(): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-connection-status-header-actions">
      <Button asChild data-testid="help-connection-status-primary-cta" size="sm" variant="primary">
        <Link href={CONNECTION_STATUS_HELP_PRIMARY_ACTION.href}>
          {CONNECTION_STATUS_HELP_PRIMARY_ACTION.label}
        </Link>
      </Button>
    </div>
  );
}
