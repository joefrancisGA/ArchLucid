"use client";

import Link from "next/link";

import { InAppHelpLink } from "@/components/InAppHelpLink";

type OperatorErrorRecoveryActionsProps = {
  readonly helpSlug?: string;
  readonly showSystemHealth?: boolean;
};

/** Standard retry / help actions below operator error callouts (request ID is shown by the parent callout). */
export function OperatorErrorRecoveryActions(props: OperatorErrorRecoveryActionsProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm" data-testid="operator-error-recovery-actions">
      <button
        type="button"
        className="text-sm font-medium text-teal-800 underline dark:text-teal-300"
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
        <Link href="/health" className="text-sm font-medium text-teal-800 underline dark:text-teal-300">
          System health
        </Link>
      ) : null}
    </div>
  );
}
