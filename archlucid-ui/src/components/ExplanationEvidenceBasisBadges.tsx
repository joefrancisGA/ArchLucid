import { cn } from "@/lib/utils";
import { enterpriseStatusTagClass, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactElement } from "react";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import {
  resolveExplanationEvidenceBasisBadges,
  type ResolveExplanationEvidenceBasisInput,
} from "@/lib/explanation-evidence-basis";

type ExplanationEvidenceBasisBadgesProps = ResolveExplanationEvidenceBasisInput & {
  readonly compact?: boolean;
};

function badgeClass(warn: boolean): string {
  if (warn) {
    return enterpriseStatusTagClass("needs-attention");
  }

  return enterpriseStatusTagClass("ready");
}

/** Shared explanation evidence labels for UI surfaces; these are not audit or legal attestations. */
export function ExplanationEvidenceBasisBadges(props: ExplanationEvidenceBasisBadgesProps): ReactElement {
  const badges = resolveExplanationEvidenceBasisBadges(props);
  const showDetail = props.compact !== true;

  return (
    <span className="inline-flex flex-wrap items-center gap-2" data-testid="explanation-evidence-basis-badges">
      {badges.map((badge) => (
        <span
          key={badge.label}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium",
            badgeClass(badge.warnBeforeSponsorSend),
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          {badge.display}
          <FieldHelpTooltip label={badge.display} hint={badge.detail} />
        </span>
      ))}
      {showDetail && badges.some((badge) => badge.warnBeforeSponsorSend) ? (
        <span className={cn("font-medium text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}>
          Review before external sponsor send.
        </span>
      ) : null}
    </span>
  );
}
