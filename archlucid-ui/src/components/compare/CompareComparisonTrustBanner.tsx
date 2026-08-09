import type { ReactElement } from "react";

import { cn } from "@/lib/utils";
import { useState } from "react";

import { SeverityTag } from "@/components/ui/severity-tag";
import { buildCompareComparisonTrustItems } from "@/lib/build-compare-comparison-trust-items";
import type { CompareExecutionModeHonesty } from "@/lib/compare-execution-mode-honesty";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CompareComparisonTrustBannerProps = {
  readonly executionModeHonesty: CompareExecutionModeHonesty | null;
  readonly usesCurrentEffectiveOnly: boolean;
  readonly hasAiNarrative: boolean;
};

export function CompareComparisonTrustBanner(props: CompareComparisonTrustBannerProps): ReactElement | null {
  const items = buildCompareComparisonTrustItems({
    executionModeHonesty: props.executionModeHonesty,
    usesCurrentEffectiveOnly: props.usesCurrentEffectiveOnly,
    hasAiNarrative: props.hasAiNarrative,
  });
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const primary = items[0];

  return (
    <section
      className="rounded-md border border-amber-600/35 bg-amber-50/50 px-4 py-3 dark:border-amber-800/45 dark:bg-amber-950/20"
      aria-label="Comparison trust and caveats"
      data-testid="compare-comparison-trust-banner"
    >
      <div className="flex flex-wrap items-start gap-2">
        <SeverityTag severity={primary.severity} label="Caution" />
        <p className={cn("m-0 flex-1 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {primary.headline}
        </p>
      </div>

      {items.length === 1 ? (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{primary.detail}</p>
      ) : (
        <details
          className={cn("mt-2", OPERATOR_TYPOGRAPHY.helper)}
          open={detailsOpen}
          onToggle={(event) => setDetailsOpen((event.currentTarget as HTMLDetailsElement).open)}
        >
          <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
            {detailsOpen ? "Hide comparison caveats" : `Show ${items.length} comparison caveats`}
          </summary>
          <ul className="m-0 mt-2 list-none space-y-3 p-0">
            {items.map((item) => (
              <li key={item.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityTag severity={item.severity} />
                  <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    {item.headline}
                  </span>
                </div>
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{item.detail}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
