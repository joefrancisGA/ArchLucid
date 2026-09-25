import { StatusTag } from "@/components/ui/status-tag";
import {
  ENGINEERING_TROUBLESHOOTING_HELP_APPLICABILITY_ENFORCEMENT,
  ENGINEERING_TROUBLESHOOTING_HELP_APPLICABILITY_RECORD_PRACTICE,
  ENGINEERING_TROUBLESHOOTING_HELP_APPLICABILITY_TAG,
  ENGINEERING_TROUBLESHOOTING_HELP_APPLICABILITY_TITLE,
  ENGINEERING_TROUBLESHOOTING_HELP_APPLICABILITY_WORKING,
} from "@/lib/engineering-troubleshooting-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Admin scope, seat applicability, and honest HelpTopicAuthorityGate enforcement note (HDX). */
export function HelpEngineeringTroubleshootingApplicabilityStrip(): React.JSX.Element {
  return (
    <section
      aria-labelledby="help-engineering-troubleshooting-applicability-heading"
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-engineering-troubleshooting-applicability"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2
          id="help-engineering-troubleshooting-applicability-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {ENGINEERING_TROUBLESHOOTING_HELP_APPLICABILITY_TITLE}
        </h2>
        <StatusTag
          kind="neutral"
          label={ENGINEERING_TROUBLESHOOTING_HELP_APPLICABILITY_TAG}
          data-testid="help-engineering-troubleshooting-applicability-tag"
        />
      </div>
      <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="help-engineering-troubleshooting-applicability-working">
        {ENGINEERING_TROUBLESHOOTING_HELP_APPLICABILITY_WORKING}
      </p>
      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="help-engineering-troubleshooting-applicability-record-practice"
      >
        {ENGINEERING_TROUBLESHOOTING_HELP_APPLICABILITY_RECORD_PRACTICE}
      </p>
      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-engineering-troubleshooting-applicability-enforcement"
      >
        {ENGINEERING_TROUBLESHOOTING_HELP_APPLICABILITY_ENFORCEMENT}
      </p>
    </section>
  );
}
