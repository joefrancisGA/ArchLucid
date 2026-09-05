import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  LONG_OPERATION_QUEUE_STATUS_LABEL,
  resolveLongOperationQueueStatusValue,
} from "@/lib/operations/long-operation-wait-copy";
import { cn } from "@/lib/utils";

export type LongOperationQueueStatusLineProps = {
  readonly stageLabel: string;
  readonly elapsedMs?: number;
  readonly className?: string;
  readonly testId?: string;
};

/** Queue status row — bold label, normal-weight stage value (TB-2078). */
export function LongOperationQueueStatusLine(props: LongOperationQueueStatusLineProps): React.JSX.Element {
  const value = resolveLongOperationQueueStatusValue(props.stageLabel, props.elapsedMs);

  return (
    <p
      className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body, props.className)}
      data-testid={props.testId}
    >
      <span className="font-semibold">{LONG_OPERATION_QUEUE_STATUS_LABEL}</span> {value}
    </p>
  );
}
