import { PROCUREMENT_HELP_LAST_REVIEWED_LABEL } from "@/lib/procurement-help-evidence-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Title-block as-of line for `/help/procurement` (TB-2093). */
export function ProcurementHelpHeaderAsOfLine(): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
      data-testid="procurement-help-last-reviewed"
    >
      {PROCUREMENT_HELP_LAST_REVIEWED_LABEL}
    </p>
  );
}
