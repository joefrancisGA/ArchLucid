import { cn } from "@/lib/utils";

import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FinalizeReadinessChecklistParityBannerProps = {
  readonly checklistReadyToFinalize: boolean;
  readonly readinessReadyToFinalize: boolean;
};

/** Explains checklist vs commit-authority divergence when the two ready flags disagree. */
export function FinalizeReadinessChecklistParityBanner(
  props: FinalizeReadinessChecklistParityBannerProps,
): React.JSX.Element | null {
  if (props.checklistReadyToFinalize === props.readinessReadyToFinalize) {
    return null;
  }

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.infoShell, "mb-3 flex-col gap-2")}
      data-testid="finalize-readiness-checklist-parity-banner"
      role="status"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Checklist and finalize readiness differ
      </p>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        The finalize button follows the server readiness contract below. The pre-finalize checklist tracks
        additional operator hygiene items that may not block commit authority.
      </p>
    </div>
  );
}
