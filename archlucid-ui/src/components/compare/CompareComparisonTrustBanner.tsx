import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

import { SeverityTag } from "@/components/ui/severity-tag";
import { buildCompareComparisonTrustItems } from "@/lib/build-compare-comparison-trust-items";
import type { CompareExecutionModeHonesty } from "@/lib/compare-execution-mode-honesty";
import type { FindingSeverityKind } from "@/lib/design-tokens";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CompareComparisonTrustBannerProps = {
  readonly executionModeHonesty: CompareExecutionModeHonesty | null;
  readonly usesCurrentEffectiveOnly: boolean;
  readonly hasAiNarrative: boolean;
};

const SEVERITY_RANK: Record<FindingSeverityKind, number> = {
  critical: 0,
  error: 1,
  high: 2,
  warning: 3,
  medium: 4,
  low: 5,
  info: 6,
  unknown: 7,
};

function isMediumOrHigher(severity: FindingSeverityKind): boolean {
  return SEVERITY_RANK[severity] <= SEVERITY_RANK.medium;
}

function renderTrustItem(item: { id: string; severity: FindingSeverityKind; headline: string; detail: string }) {
  return (
    <li key={item.id}>
      <div className="flex flex-wrap items-center gap-2">
        <SeverityTag severity={item.severity} />
        <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{item.headline}</span>
      </div>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{item.detail}</p>
    </li>
  );
}

export function CompareComparisonTrustBanner(props: CompareComparisonTrustBannerProps): ReactElement | null {
  const items = buildCompareComparisonTrustItems({
    executionModeHonesty: props.executionModeHonesty,
    usesCurrentEffectiveOnly: props.usesCurrentEffectiveOnly,
    hasAiNarrative: props.hasAiNarrative,
  });

  if (items.length === 0) {
    return null;
  }

  const alwaysVisibleItems = items.filter((item) => isMediumOrHigher(item.severity));
  const collapsibleItems = items.filter((item) => !isMediumOrHigher(item.severity));

  if (items.length === 1) {
    const only = items[0];

    return (
      <section
        className={cn(DESIGN_TOKENS.callout.warn, "px-4 py-3")}
        aria-label="Comparison trust and caveats"
        data-testid="compare-comparison-trust-banner"
      >
        <div className="flex flex-wrap items-start gap-2">
          <SeverityTag severity={only.severity} label="Caution" />
          <p className={cn("m-0 flex-1 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {only.headline}
          </p>
        </div>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{only.detail}</p>
      </section>
    );
  }

  return (
    <section
      className={cn(DESIGN_TOKENS.callout.warn, "px-4 py-3")}
      aria-label="Comparison trust and caveats"
      data-testid="compare-comparison-trust-banner"
    >
      <div className="flex flex-wrap items-center gap-2">
        <SeverityTag severity={alwaysVisibleItems[0]?.severity ?? items[0].severity} label="Caution" />
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          Comparison caveats
        </p>
      </div>

      {alwaysVisibleItems.length > 0 ? (
        <ul className="m-0 mt-2 list-none space-y-3 p-0" data-testid="compare-trust-visible-items">
          {alwaysVisibleItems.map((item) => renderTrustItem(item))}
        </ul>
      ) : null}

      {collapsibleItems.length > 0 ? (
        <details className={cn("mt-2", OPERATOR_TYPOGRAPHY.helper)}>
          <summary className="cursor-pointer text-al-text-primary">
            {`Show ${collapsibleItems.length} additional comparison caveat${collapsibleItems.length === 1 ? "" : "s"}`}
          </summary>
          <ul className="m-0 mt-2 list-none space-y-3 p-0">
            {collapsibleItems.map((item) => renderTrustItem(item))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
