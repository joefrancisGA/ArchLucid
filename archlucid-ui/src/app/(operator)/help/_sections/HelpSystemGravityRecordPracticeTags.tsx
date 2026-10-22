import { StatusTag } from "@/components/ui/status-tag";
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";

type HelpSystemGravityRecordPracticeTagsProps = {
  readonly testIdPrefix?: string;
};

/** Canonical Record / Practice review-type tags for system-gravity help prose. */
export function HelpSystemGravityRecordPracticeTags(
  props: HelpSystemGravityRecordPracticeTagsProps,
): React.ReactElement {
  const prefix = props.testIdPrefix ?? "help-system-gravity";

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 align-middle">
      <StatusTag kind="ready" label={WORKING_CAREER_DOOR_LABEL} data-testid={`${prefix}-record-practice-record-tag`} />
      <StatusTag kind="draft" label={WORKING_REHEARSAL_DOOR_LABEL} data-testid={`${prefix}-record-practice-practice-tag`} />
    </span>
  );
}

export function HelpSystemGravityRecordTag(props: { readonly testIdPrefix?: string }): React.ReactElement {
  const prefix = props.testIdPrefix ?? "help-system-gravity";

  return <StatusTag kind="ready" label={WORKING_CAREER_DOOR_LABEL} data-testid={`${prefix}-record-effects-tag`} />;
}

export function HelpSystemGravityPracticeTag(props: { readonly testIdPrefix?: string }): React.ReactElement {
  const prefix = props.testIdPrefix ?? "help-system-gravity";

  return <StatusTag kind="draft" label={WORKING_REHEARSAL_DOOR_LABEL} data-testid={`${prefix}-practice-effects-tag`} />;
}
