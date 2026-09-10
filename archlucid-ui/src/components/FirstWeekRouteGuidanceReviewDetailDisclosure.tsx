"use client";

import { type ReactElement } from "react";

import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { useOperatorHomeBooleanDisclosureUrlSync } from "@/hooks/use-operator-home-boolean-disclosure-url-sync";
import { FIRST_WEEK_ROUTE_GUIDANCE_REVIEW_DETAIL_COMMITTED_COLLAPSED_SUMMARY } from "@/lib/first-week-route-guidance";
import {
  firstWeekRouteGuidanceReviewDetailDisclosureHrefFromSearch,
  parseFirstWeekRouteGuidanceReviewDetailOpenFromSearch,
} from "@/lib/operator/first-week-route-guidance-review-detail-disclosure-url";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator/operator-home-disclosure-storage";

type FirstWeekRouteGuidanceReviewDetailDisclosureProps = {
  readonly children: React.ReactNode;
};

/** Review-detail committed first-week guidance with URL-synced disclosure state. */
export function FirstWeekRouteGuidanceReviewDetailDisclosure(
  props: FirstWeekRouteGuidanceReviewDetailDisclosureProps,
): ReactElement {
  const [expanded, setExpanded] = useOperatorHomeBooleanDisclosureUrlSync(
    OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.firstWeekGuidance,
    "firstWeekRouteGuidanceReviewDetailOpen",
    parseFirstWeekRouteGuidanceReviewDetailOpenFromSearch,
    firstWeekRouteGuidanceReviewDetailDisclosureHrefFromSearch,
    false,
  );

  return (
    <OperatorHomeDisclosureSection
      title="Review guidance"
      titleId="first-week-guidance-review-detail-committed"
      sectionTestId="first-week-route-guidance-review-detail-committed"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.firstWeekGuidance}
      defaultExpanded={false}
      expanded={expanded}
      onExpandedChange={setExpanded}
      collapsedSummary={FIRST_WEEK_ROUTE_GUIDANCE_REVIEW_DETAIL_COMMITTED_COLLAPSED_SUMMARY}
    >
      {props.children}
    </OperatorHomeDisclosureSection>
  );
}
