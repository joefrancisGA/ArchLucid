"use client";

import Link from "next/link";

import { useLongOperationWait } from "@/hooks/use-long-operation-wait";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type LongOperationWaitNoticeProps = {
  readonly active: boolean;
  readonly operationLabel: string;
  readonly stageLabel?: string;
  readonly className?: string;
  readonly testId?: string;
  /** When escalation reaches timeoutHint, offer Reviews + Help recovery links. */
  readonly showTimeoutRecovery?: boolean;
};

/**
 * Tier B staged wait surface — named stages + escalation copy, no fake % (TB-2078).
 */
export function LongOperationWaitNotice(props: LongOperationWaitNoticeProps): React.JSX.Element | null {
  const wait = useLongOperationWait({
    active: props.active,
    operationLabel: props.operationLabel,
    stageLabel: props.stageLabel,
  });

  if (!props.active) {
    return null;
  }

  const showTimeout = props.showTimeoutRecovery !== false && wait.level === "timeoutHint";

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-3",
        showTimeout
          ? "border-amber-600/35 bg-al-surface-raised dark:border-amber-700/45"
          : "border-neutral-200 bg-al-surface-raised dark:border-neutral-700",
        props.className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid={props.testId ?? "long-operation-wait-notice"}
      data-escalation-level={wait.level}
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{wait.copy.headline}</p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{wait.copy.detail}</p>
      {showTimeout ? (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Recovery:{" "}
          <Link
            href="/architecture/reviews?projectId=default"
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
          >
            Reviews
          </Link>
          {" · "}
          <Link href="/help" className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            Help
          </Link>
        </p>
      ) : null}
    </div>
  );
}
