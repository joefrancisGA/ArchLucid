import Link from "next/link";

import { CORE_PILOT_HELP_CLAIM_DISCIPLINE } from "@/lib/core-pilot-help-evidence-copy";
import { CORE_PILOT_HELP_CLOSING_PANEL_TITLE } from "@/lib/core-pilot-help-guide-content";
import { corePilotHelpRelatedGuides } from "@/lib/core-pilot-help-related-guides";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Merged closing block: related guides plus claim discipline (replaces separate Ready to begin / orientation footer). */
export function CorePilotHelpClosingPanel(): React.JSX.Element {
  return (
    <section
      id="next-steps-related-help"
      aria-labelledby="core-pilot-help-closing-heading"
      className={cn(
        OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
        "space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-800",
      )}
      data-testid="core-pilot-help-closing-panel"
    >
      <h2 id="core-pilot-help-closing-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {CORE_PILOT_HELP_CLOSING_PANEL_TITLE}
      </h2>

      <div className="space-y-3" data-testid="core-pilot-related-guides">
        <ul className={cn("m-0 flex flex-wrap gap-x-4 gap-y-2 p-0 list-none", OPERATOR_TYPOGRAPHY.body)}>
          {corePilotHelpRelatedGuides().map((guide) => (
            <li key={guide.href}>
              <Link href={guide.href} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
                {guide.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div data-testid="core-pilot-help-orientation">
        <h3 className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Before you share externally</h3>
        <p
          className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="core-pilot-help-claim-discipline"
        >
          {CORE_PILOT_HELP_CLAIM_DISCIPLINE}
        </p>
      </div>
    </section>
  );
}
