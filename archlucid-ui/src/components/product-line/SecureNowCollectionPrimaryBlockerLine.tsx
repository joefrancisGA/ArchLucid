"use client";

import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SecureNowCollectionMissingInput } from "@/lib/product-line/securenow-collection-missing-reason";
import {
  resolveSecureNowCollectionPrimaryBlocker,
  resolveSecureNowCollectionYouAreHere,
} from "@/lib/product-line/securenow-collection-setup-checklist";
import { cn } from "@/lib/utils";

export type SecureNowCollectionPrimaryBlockerLineProps = {
  readonly input: SecureNowCollectionMissingInput;
  readonly testIdPrefix: string;
  readonly youAreHereMode?: boolean;
};

/** Surfaces the single blocking collection step above the full checklist. */
export function SecureNowCollectionPrimaryBlockerLine(
  props: SecureNowCollectionPrimaryBlockerLineProps,
): React.JSX.Element | null {
  const youAreHere = resolveSecureNowCollectionYouAreHere(props.input);
  const blocker = resolveSecureNowCollectionPrimaryBlocker(props.input);

  if (blocker === null || youAreHere === null) {
    return null;
  }

  if (props.youAreHereMode === true) {
    return (
      <div
        className={cn(
          "space-y-2 rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30",
        )}
        data-testid={`${props.testIdPrefix}-collection-you-are-here`}
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          <span className="font-medium text-al-text-primary">You are here:</span> step {youAreHere.stepIndex} of{" "}
          {youAreHere.stepCount} — {youAreHere.stepLabel}. {blocker.detail}
        </p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          <Link
            className={OPERATOR_LINK.inline}
            href={youAreHere.recoveryHref}
            data-testid={`${props.testIdPrefix}-collection-you-are-here-recovery`}
          >
            Fix this step
          </Link>
        </p>
      </div>
    );
  }

  return (
    <p
      className={cn(
        "m-0 rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid={`${props.testIdPrefix}-collection-primary-blocker`}
    >
      <span className="font-medium text-al-text-primary">Blocking collection step:</span>{" "}
      <Link className={OPERATOR_LINK.inline} href={blocker.recoveryHref}>
        {blocker.stepLabel}
      </Link>
      . {blocker.detail}
    </p>
  );
}
