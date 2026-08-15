"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { InAppHelpLink } from "@/components/InAppHelpLink";

type OperatorErrorRecoveryActionsProps = {
  readonly helpSlug?: string;
  readonly helpHashFragment?: string;
  readonly showSystemHealth?: boolean;
};

/** Standard retry / help actions below operator error callouts (request ID is shown by the parent callout). */
export function OperatorErrorRecoveryActions(props: OperatorErrorRecoveryActionsProps) {
  return (
    <div className={cn("mt-3 flex flex-wrap items-center gap-3", OPERATOR_TYPOGRAPHY.body)} data-testid="operator-error-recovery-actions">
      <button
        type="button"
        className={cn("auth-panel-focus cursor-pointer", OPERATOR_BODY_INLINE_LINK_CLASS)}
        onClick={() => {
          window.location.reload();
        }}
      >
        Retry
      </button>
      {props.helpSlug !== undefined ? (
        <InAppHelpLink
          helpSlug={props.helpSlug}
          hashFragment={props.helpHashFragment}
          label="Open troubleshooting"
          variant="text"
        />
      ) : (
        <Link href="/help/troubleshooting" className={OPERATOR_BODY_INLINE_LINK_CLASS}>
          Open troubleshooting
        </Link>
      )}
      {props.showSystemHealth === true ? (
        <Link href="/administration/system-health" className={OPERATOR_BODY_INLINE_LINK_CLASS}>
          System health
        </Link>
      ) : null}
    </div>
  );
}
