import { CopyIdButton } from "@/components/CopyIdButton";
import {
  SYSTEM_GRAVITY_HELP_TECHNICAL_HEADING,
  SYSTEM_GRAVITY_HELP_TECHNICAL_HEADING_ID,
  SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS,
  SYSTEM_GRAVITY_HELP_TECHNICAL_INTRO,
} from "@/lib/system-gravity-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Keyboard-expandable engineering identifiers for `/help/system-gravity`. */
export function HelpSystemGravityTechnicalReference(): React.ReactElement {
  return (
    <details
      id={SYSTEM_GRAVITY_HELP_TECHNICAL_HEADING_ID}
      className={HELP_PAGE_LAYOUT.details}
      data-testid="help-system-gravity-technical-reference"
    >
      <summary
        className={cn(
          "cursor-pointer select-none font-semibold text-al-text-primary",
          OPERATOR_TYPOGRAPHY.cardTitle,
        )}
      >
        {SYSTEM_GRAVITY_HELP_TECHNICAL_HEADING}
      </summary>
      <div className={HELP_PAGE_LAYOUT.detailsBody}>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{SYSTEM_GRAVITY_HELP_TECHNICAL_INTRO}</p>
        <ul
          className={cn("m-0 mt-3 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}
          data-testid="help-system-gravity-technical-reference-list"
        >
          {SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS.map((identifier) => (
            <li key={identifier} className="flex flex-wrap items-center gap-2">
              <code className="text-sm">{identifier}</code>
              <CopyIdButton value={identifier} aria-label={`Copy ${identifier}`} />
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
