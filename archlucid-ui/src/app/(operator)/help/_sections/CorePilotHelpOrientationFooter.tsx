import { CORE_PILOT_HELP_CLAIM_DISCIPLINE } from "@/lib/core-pilot-help-evidence-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Claim discipline for COR `/help/first-architecture-review`, kept verbatim but placed at the
 * end of the guide. Leading a how-to page with the disclaimer pushed the instructions below the fold.
 */
export function CorePilotHelpOrientationFooter(): React.JSX.Element {
  return (
    <section
      className="border-t border-neutral-200 pt-4 dark:border-neutral-800"
      aria-labelledby="core-pilot-help-orientation-heading"
      data-testid="core-pilot-help-orientation"
    >
      <h2
        id="core-pilot-help-orientation-heading"
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      >
        Before you share externally
      </h2>
      <p
        className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="core-pilot-help-claim-discipline"
      >
        {CORE_PILOT_HELP_CLAIM_DISCIPLINE}
      </p>
    </section>
  );
}
