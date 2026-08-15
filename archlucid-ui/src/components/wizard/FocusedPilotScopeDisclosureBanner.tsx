import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES,
  REVIEW_SCOPE_WORKSPACE_DISAMBIGUATION,
} from "@/lib/focused-pilot-mode-policy-packs";

export type FocusedPilotScopeDisclosureBannerProps = {
  readonly focusedModeEnabled: boolean;
  readonly className?: string;
};

/** Clarifies review standards scope vs workspace scope on intake wizards (TB-764). */
export function FocusedPilotScopeDisclosureBanner(
  props: FocusedPilotScopeDisclosureBannerProps,
): ReactElement {
  const { focusedModeEnabled, className } = props;

  return (
    <div
      role="note"
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40",
        className,
      )}
      data-testid="focused-pilot-scope-disclosure-banner"
    >
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        {REVIEW_SCOPE_WORKSPACE_DISAMBIGUATION}
      </p>
      <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        {focusedModeEnabled
          ? `Focused review scope: ${FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES.join(", ")}.`
          : "Expanded review scope: every standard enabled for this workspace may contribute findings."}
      </p>
    </div>
  );
}
