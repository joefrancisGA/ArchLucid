import type { ReactElement } from "react";

import { enterpriseStatusTagClass } from "@/lib/design-tokens";
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
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeClass(badge.warnBeforeSponsorSend)}`}
          title={badge.detail}
        >
          {badge.display}
        </span>
      ))}
      {showDetail && badges.some((badge) => badge.warnBeforeSponsorSend) ? (
        <span className="text-[11px] font-medium text-amber-900 dark:text-amber-100">
          Review before external sponsor send.
        </span>
      ) : null}
    </span>
  );
}
