"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { CircleHelp } from "lucide-react";

import { HelpPopover, HelpPopoverContent, HelpPopoverTrigger } from "@/components/ui/help-popover";
import type { PageContextualHelpEntry } from "@/lib/contextual-help-registry";
import { PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME } from "@/components/usability/page-contextual-help-trigger";

export type PageScopedContextualHelpPanelProps = {
  readonly entry: PageContextualHelpEntry;
  /** Full topic name — used for the accessible name (`Help: {triggerLabel}`). */
  readonly triggerLabel: string;
  /** Optional short visible trigger text (e.g. "Help"); defaults to `triggerLabel`. */
  readonly triggerText?: string;
  readonly learnMoreHref?: string | null;
};

type HelpFieldProps = {
  readonly label: string;
  readonly body: string;
  readonly action?: { readonly label: string; readonly href: string };
  readonly actionTestId?: string;
};

function HelpField({ label, body, action, actionTestId }: HelpFieldProps) {
  return (
    <div className="space-y-0.5">
      <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}>
        {label}
      </p>
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>{body}</p>
      {action != null ? (
        <p className={cn("m-0 pt-0.5", OPERATOR_TYPOGRAPHY.helper)}>
          <Link
            href={action.href}
            className={OPERATOR_LINK.inline}
            data-testid={actionTestId}
          >
            {action.label} →
          </Link>
        </p>
      ) : null}
    </div>
  );
}

/**
 * Page-scoped contextual help: press the header trigger to open the Category-1 answers with an
 * optional Learn more deep link. `align="end"` keeps the panel under the right-aligned header
 * trigger; Radix shifts it away from the viewport edge when the trigger sits near one.
 */
export function PageScopedContextualHelpPanel({
  entry,
  triggerLabel,
  triggerText,
  learnMoreHref,
}: PageScopedContextualHelpPanelProps) {
  const visibleTriggerText = triggerText ?? triggerLabel;

  return (
    <HelpPopover>
      <HelpPopoverTrigger asChild>
        <button
          type="button"
          className={PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME}
          data-testid="page-contextual-help-button"
          aria-label={`Help: ${triggerLabel}`}
        >
          <CircleHelp className="h-4 w-4" aria-hidden />
          <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>{visibleTriggerText}</span>
        </button>
      </HelpPopoverTrigger>

      <HelpPopoverContent
        align="end"
        aria-label="Page help"
        className="space-y-2"
        data-testid="page-scoped-contextual-help-panel"
      >
        <HelpField label="What is this page?" body={entry.whatIsThisPage} />
        <HelpField
          label="What to do next"
          body={entry.whatToDoNext}
          action={entry.whatToDoNextAction}
          actionTestId="page-scoped-contextual-help-next-action"
        />

        {entry.whyEmpty != null ? <HelpField label="Why is this empty?" body={entry.whyEmpty} /> : null}

        {entry.whereToConfigurePrerequisite != null ? (
          <HelpField
            label="Where to configure"
            body={entry.whereToConfigurePrerequisite}
            action={entry.whereToConfigureAction}
            actionTestId="page-scoped-contextual-help-configure-action"
          />
        ) : null}

        {learnMoreHref != null ? (
          <p className={cn("m-0 pt-1", OPERATOR_TYPOGRAPHY.helper)}>
            <Link
              href={learnMoreHref}
              className={OPERATOR_LINK.optional}
              data-testid="page-scoped-contextual-help-learn-more"
            >
              Learn more →
            </Link>
          </p>
        ) : null}
      </HelpPopoverContent>
    </HelpPopover>
  );
}
