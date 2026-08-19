"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useInviteeReviewerContext } from "@/hooks/use-invitee-reviewer-context";
import {
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_DESTINATION_CALLOUT,
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_HASH,
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_QUERY,
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_VALUE,
  isGoldenSponsorPackageWalkthroughIntent,
} from "@/lib/golden-sponsor-package-walkthrough";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const SPONSOR_HANDOFF_SCROLL_MAX_ATTEMPTS = 24;

type GoldenSponsorPackageWalkthroughDestinationProps = {
  /** Sample/showcase context only — avoids sample export copy on live reviews (TB-2138). */
  readonly showSampleWalkthroughDestination: boolean;
};

function scrollToSponsorHandoffAnchor(): boolean {
  const target = document.getElementById(GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_HASH);

  if (target === null) {
    return false;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });

  return true;
}

/** Highlights the sponsor export destination when the walkthrough query is present (TB-2138). */
export function GoldenSponsorPackageWalkthroughDestination(
  props: GoldenSponsorPackageWalkthroughDestinationProps,
): React.JSX.Element | null {
  const { isInviteeReviewer } = useInviteeReviewerContext();
  const searchParams = useSearchParams();
  const walkthroughParam = searchParams?.get(GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_QUERY) ?? null;
  const active =
    !isInviteeReviewer &&
    props.showSampleWalkthroughDestination &&
    isGoldenSponsorPackageWalkthroughIntent(walkthroughParam);

  useEffect(() => {
    if (!active) {
      return;
    }

    let canceled = false;
    let attempts = 0;

    const tryScroll = (): void => {
      if (canceled) {
        return;
      }

      if (scrollToSponsorHandoffAnchor()) {
        return;
      }

      attempts += 1;

      if (attempts < SPONSOR_HANDOFF_SCROLL_MAX_ATTEMPTS) {
        requestAnimationFrame(tryScroll);
      }
    };

    tryScroll();

    return () => {
      canceled = true;
    };
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <aside
      className={cn(
        "mb-3 rounded-md border border-teal-200 bg-teal-50/70 p-3 dark:border-teal-900 dark:bg-teal-950/30",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="golden-sponsor-package-walkthrough-destination"
      data-walkthrough={GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_VALUE}
    >
      <p className="m-0 text-al-text-primary">{GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_DESTINATION_CALLOUT}</p>
    </aside>
  );
}
