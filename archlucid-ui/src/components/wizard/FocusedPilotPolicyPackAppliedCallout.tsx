import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import {
  FOCUSED_PILOT_MODE_COPY,
  FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES,
} from "@/lib/focused-pilot-mode-policy-packs";

export type FocusedPilotPolicyPackAppliedCalloutProps = {
  readonly className?: string;
};

/** Surfaces auto-applied focused pilot policy packs on first-run intake (no manual assignment). */
export function FocusedPilotPolicyPackAppliedCallout(
  props: FocusedPilotPolicyPackAppliedCalloutProps,
): ReactElement {
  const { className } = props;

  return (
    <div
      className={cn(
        "rounded-md border border-teal-300/80 bg-teal-50/90 p-3 dark:border-teal-800 dark:bg-teal-950/30",
        className,
      )}
      data-testid="focused-pilot-policy-pack-applied-callout"
    >
      <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {FOCUSED_PILOT_MODE_COPY.appliedCalloutTitle}
      </p>
      <p className={cn("m-0 mt-1 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {FOCUSED_PILOT_MODE_COPY.appliedCalloutBody}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES.map((packName) => (
          <StatusTag key={packName} kind="neutral" label={packName} />
        ))}
      </div>
    </div>
  );
}
