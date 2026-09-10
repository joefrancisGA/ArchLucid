"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SPONSOR_DASHBOARD_HOW_IT_WORKS_OPEN_PARAM,
  parseSponsorDashboardHowItWorksOpenFromSearch,
  sponsorDashboardHowItWorksDisclosureHrefFromSearch,
} from "@/lib/sponsor/sponsor-dashboard-how-it-works-disclosure-url";

/** Progressive disclosure for dashboard prerequisites — keeps the hero calm for sponsor readers. */
export function SponsorDashboardHowItWorks(): React.JSX.Element {
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const howItWorksOpenParam = searchParams.get(SPONSOR_DASHBOARD_HOW_IT_WORKS_OPEN_PARAM);
  const [howItWorksOpen, setHowItWorksOpenState] = useState(() =>
    parseSponsorDashboardHowItWorksOpenFromSearch(howItWorksOpenParam),
  );

  const syncHowItWorksOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(sponsorDashboardHowItWorksDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setHowItWorksOpen = useCallback(
    (open: boolean) => {
      setHowItWorksOpenState(open);
      syncHowItWorksOpenToUrl(open);
    },
    [syncHowItWorksOpenToUrl],
  );

  useEffect(() => {
    setHowItWorksOpenState(parseSponsorDashboardHowItWorksOpenFromSearch(howItWorksOpenParam));
  }, [howItWorksOpenParam]);

  return (
    <CollapsibleSection
      title={v.howItWorksSectionTitle}
      sectionTestId="sponsor-dashboard-how-it-works"
      summaryId="sponsor-dashboard-how-it-works-summary"
      open={howItWorksOpen}
      onToggle={setHowItWorksOpen}
    >
      <p className={`m-0 text-al-text-secondary ${OPERATOR_TYPOGRAPHY.body}`}>{v.howItWorksDescription}</p>
      <p className="m-0 mt-3">
        <Link
          href={v.portfolioPageLearnMoreHref}
          className={OPERATOR_LINK.inline}
          data-testid="sponsor-dashboard-how-it-works-guide"
        >
          {v.portfolioPageLearnMoreLabel}
        </Link>
      </p>
    </CollapsibleSection>
  );
}
