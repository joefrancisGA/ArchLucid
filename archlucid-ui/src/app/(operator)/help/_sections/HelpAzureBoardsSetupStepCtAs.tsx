import Link from "next/link";

import { Button } from "@/components/ui/button";
import { azureBoardsHelpSetupStepCtas } from "@/lib/azure-boards-help-setup-step-ctas";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Setup-step deep links for `/help/azure-boards` (TB-1620). */
export function HelpAzureBoardsSetupStepCtAs(): React.ReactElement {
  return (
    <div className="space-y-2" data-testid="help-azure-boards-setup-step-ctas">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Setup shortcuts</p>
      <div className="flex flex-wrap gap-2">
        {azureBoardsHelpSetupStepCtas().map((cta) => (
          <Button key={cta.testId} asChild size="sm" variant="outline" data-testid={cta.testId}>
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
