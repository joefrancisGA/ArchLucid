import { StatusTag } from "@/components/ui/status-tag";
import { ACCELERATOR_FOLLOWUP_PACK_TAG_LABEL } from "@/lib/accelerator-chooser-pack-prerequisite";
import { cn } from "@/lib/utils";

type AcceleratorFollowUpPackTagProps = {
  readonly className?: string;
  readonly testId?: string;
};

/** Persistent specialty-pack taxonomy label — independent of tenant prerequisite gate state. */
export function AcceleratorFollowUpPackTag(props: AcceleratorFollowUpPackTagProps): React.ReactElement {
  return (
    <StatusTag
      kind="neutral"
      label={ACCELERATOR_FOLLOWUP_PACK_TAG_LABEL}
      className={cn("mt-2", props.className)}
      data-testid={props.testId}
    />
  );
}
