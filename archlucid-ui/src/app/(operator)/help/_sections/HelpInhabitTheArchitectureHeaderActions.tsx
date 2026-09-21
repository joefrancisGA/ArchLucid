import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_ACTION,
  INHABIT_THE_ARCHITECTURE_HELP_SECURITY_TRUST_ACTION,
} from "@/lib/inhabit/inhabit-help-guide-content";

/** Header actions for `/help/inhabit-the-architecture` (IH-014 Phase 2). */
export function HelpInhabitTheArchitectureHeaderActions(): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-inhabit-the-architecture-header-actions">
      <Button asChild data-testid={INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_ACTION.testId} size="sm" variant="primary">
        <Link href={INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_ACTION.href}>
          {INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_ACTION.label}
        </Link>
      </Button>
      <Button asChild data-testid={INHABIT_THE_ARCHITECTURE_HELP_SECURITY_TRUST_ACTION.testId} size="sm" variant="secondary">
        <Link href={INHABIT_THE_ARCHITECTURE_HELP_SECURITY_TRUST_ACTION.href}>
          {INHABIT_THE_ARCHITECTURE_HELP_SECURITY_TRUST_ACTION.label}
        </Link>
      </Button>
    </div>
  );
}
