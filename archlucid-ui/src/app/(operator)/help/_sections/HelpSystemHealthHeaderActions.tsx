import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SYSTEM_HEALTH_HELP_PRIMARY_ACTION } from "@/lib/system-health-help-guide-content";

/** Primary destination for `/help/system-health` — single header CTA (HEY). */
export function HelpSystemHealthHeaderActions(): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-system-health-header-actions">
      <Button asChild data-testid="help-system-health-primary-cta" size="sm" variant="primary">
        <Link href={SYSTEM_HEALTH_HELP_PRIMARY_ACTION.href}>{SYSTEM_HEALTH_HELP_PRIMARY_ACTION.label}</Link>
      </Button>
    </div>
  );
}
