"use client";

import Link from "next/link";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { OPERATOR_LINK } from "@/lib/design-tokens";

type SponsorDashboardHeaderActionsProps = {
  readonly dashboardEmpty: boolean;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
};

/** Header actions for `/architecture/sponsor-dashboard` (ARE). */
export function SponsorDashboardHeaderActions(props: SponsorDashboardHeaderActionsProps): React.JSX.Element {
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="sponsor-dashboard-hero-actions">
      <PageContextualHelpButton />
      <RefreshButton
        data-testid="sponsor-dashboard-refresh-button"
        busy={props.refreshing}
        onClick={props.onRefresh}
      />
      {props.dashboardEmpty ? (
        <Button variant="primary" size="sm" asChild>
          <Link href="/architecture/reviews/new" className="no-underline" data-testid="sponsor-dashboard-hero-start-review">
            {v.emptyStatePrimaryAction}
          </Link>
        </Button>
      ) : (
        <Link
          href={v.portfolioPageLearnMoreHref}
          className={OPERATOR_LINK.optional}
          data-testid="sponsor-dashboard-hero-learn-more"
        >
          {v.portfolioPageLearnMoreLabel}
        </Link>
      )}
    </div>
  );
}
