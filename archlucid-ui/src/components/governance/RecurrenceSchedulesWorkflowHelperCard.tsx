import { CollapsibleSection } from "@/components/CollapsibleSection";
import { InlineGuidance } from "@/components/InlineGuidance";
import {
  RECURRENCE_SCHEDULES_HELPER_BODY,
  RECURRENCE_SCHEDULES_HELPER_NEXT_STEP,
  RECURRENCE_SCHEDULES_HELPER_TITLE,
} from "@/lib/recurrence-schedules-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * TB-1573 anti-exemplar: teaching helper must not be a persistent right rail.
 * Collapsed disclosure keeps Next-step guidance without opening a second column.
 */
export function RecurrenceSchedulesWorkflowHelperCard() {
  return (
    <CollapsibleSection
      title={RECURRENCE_SCHEDULES_HELPER_TITLE}
      headingLevel={3}
      sectionTestId="recurrence-schedules-helper-card"
      defaultOpen={false}
    >
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {RECURRENCE_SCHEDULES_HELPER_BODY}
      </p>
      <p className={cn("m-0 mt-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        <InlineGuidance label="Next step:" labelTestId="inline-guidance-next-step">
          {RECURRENCE_SCHEDULES_HELPER_NEXT_STEP}
        </InlineGuidance>
      </p>
    </CollapsibleSection>
  );
}
