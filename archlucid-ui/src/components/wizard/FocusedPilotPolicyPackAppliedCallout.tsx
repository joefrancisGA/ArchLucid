import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { FOCUSED_PILOT_MODE_COPY } from "@/lib/focused-pilot-mode-policy-packs";
import { POLICY_PACKS_HELP_PATH } from "@/lib/policy-packs-page";

export type FocusedPilotPolicyPackAppliedCalloutProps = {
  readonly className?: string;
};

/** Surfaces auto-applied ArchLucid default standards on first-run intake (no manual assignment). */
export function FocusedPilotPolicyPackAppliedCallout(
  props: FocusedPilotPolicyPackAppliedCalloutProps,
): ReactElement {
  const { className } = props;

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 border-l-4 border-l-neutral-400 bg-neutral-50/90 p-4 dark:border-neutral-700 dark:border-l-neutral-500 dark:bg-neutral-900/40",
        className,
      )}
      data-testid="focused-pilot-policy-pack-applied-callout"
    >
      <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {FOCUSED_PILOT_MODE_COPY.appliedCalloutTitle}
      </p>
      <p className={cn("m-0 mt-2 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {FOCUSED_PILOT_MODE_COPY.appliedCalloutBody}{" "}
        <Link href={POLICY_PACKS_HELP_PATH} className={OPERATOR_LINK.nav}>
          Review evaluation standards
        </Link>
        .
      </p>
    </div>
  );
}
