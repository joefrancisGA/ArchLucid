"use client";

import { PreferenceAccountSyncStatus } from "@/components/preferences/PreferenceAccountSyncStatus";
import { PreferenceCheckbox } from "@/components/preferences/PreferenceCheckbox";
import type { SampleReviewsOnOverviewAccountSyncState } from "@/components/SampleReviewsOnOverviewPreferenceProvider";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  PREFERENCES_SAMPLE_REVIEWS_ON_OVERVIEW_LEAD,
  PREFERENCES_SAMPLE_REVIEWS_ON_OVERVIEW_TOGGLE_LABEL,
} from "@/lib/sample-reviews-on-overview-preference-copy";
import { SAMPLE_REVIEWS_ON_OVERVIEW_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE } from "@/lib/sample-reviews-on-overview-preference";
import { cn } from "@/lib/utils";

export type SampleReviewsOnOverviewPreferencePanelProps = {
  readonly enabled: boolean;
  readonly onEnabledChange: (enabled: boolean) => void;
  readonly accountSyncState?: SampleReviewsOnOverviewAccountSyncState;
  readonly labelledById?: string;
};

export function SampleReviewsOnOverviewPreferencePanel({
  enabled,
  onEnabledChange,
  accountSyncState = "idle",
  labelledById,
}: SampleReviewsOnOverviewPreferencePanelProps) {
  const checkboxId = "sample-reviews-on-overview-enabled";

  return (
    <section
      className="space-y-3"
      data-testid="sample-reviews-on-overview-preference-panel"
      aria-labelledby={labelledById}
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {PREFERENCES_SAMPLE_REVIEWS_ON_OVERVIEW_LEAD}
      </p>
      <label
        htmlFor={checkboxId}
        className={cn(
          "flex min-h-6 cursor-pointer items-center gap-3",
          OPERATOR_TYPOGRAPHY.body,
          "text-al-text-primary",
        )}
      >
        <PreferenceCheckbox
          id={checkboxId}
          checked={enabled}
          onCheckedChange={(checked) => onEnabledChange(checked === true)}
          data-testid="sample-reviews-on-overview-enabled"
        />
        <span>{PREFERENCES_SAMPLE_REVIEWS_ON_OVERVIEW_TOGGLE_LABEL}</span>
      </label>
      <PreferenceAccountSyncStatus
        accountSyncState={accountSyncState}
        localOnlyMessage={SAMPLE_REVIEWS_ON_OVERVIEW_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE}
        testIdPrefix="sample-reviews-on-overview"
      />
    </section>
  );
}
