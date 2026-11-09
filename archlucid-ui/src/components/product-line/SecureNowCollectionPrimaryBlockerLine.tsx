"use client";

import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SecureNowCollectionMissingInput } from "@/lib/product-line/securenow-collection-missing-reason";
import { resolveSecureNowCollectionPrimaryBlocker } from "@/lib/product-line/securenow-collection-setup-checklist";
import { cn } from "@/lib/utils";

export type SecureNowCollectionPrimaryBlockerLineProps = {
  readonly input: SecureNowCollectionMissingInput;
  readonly testIdPrefix: string;
};

/** Surfaces the single blocking collection step above the full checklist. */
export function SecureNowCollectionPrimaryBlockerLine(
  props: SecureNowCollectionPrimaryBlockerLineProps,
): React.JSX.Element | null {
  const blocker = resolveSecureNowCollectionPrimaryBlocker(props.input);

  if (blocker === null) {
    return null;
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
