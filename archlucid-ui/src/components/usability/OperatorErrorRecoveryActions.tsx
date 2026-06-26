"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import Link from "next/link";

import { InAppHelpLink } from "@/components/InAppHelpLink";

type OperatorErrorRecoveryActionsProps = {
  readonly helpSlug?: string;
  readonly showSystemHealth?: boolean;
};

/** Standard retry / help actions below operator error callouts (request ID is shown by the parent callout). */
export function OperatorErrorRecoveryActions(props: OperatorErrorRecoveryActionsProps) {
  return (
    <div className={cn("mt-3 flex flex-wrap items-center gap-3", OPERATOR_TYPOGRAPHY.body)} data-testid="operator-error-recovery-actions">
      <button
        type="button"
        className={cn("font-medium text-teal-800 underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.body)}
        onClick={() => {
          window.location.reload();
        }}
      >
        Retry
      </button>
      {props.helpSlug !== undefined ? (
        <InAppHelpLink helpSlug={props.helpSlug} label="Open troubleshooting" variant="text" />
      ) : (
        <Link href="/help/troubleshooting" className="text-teal-800 underline dark:text-teal-300">
          Open troubleshooting
        </Link>
      )}
      {props.showSystemHealth === true ? (
        <Link href="/health" className={cn("font-medium text-teal-800 underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.body)}>
          System health
        </Link>
      ) : null}
    </div>
  );
}
