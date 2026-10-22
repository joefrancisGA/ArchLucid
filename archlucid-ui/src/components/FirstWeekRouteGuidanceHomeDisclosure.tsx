"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import {
  FIRST_WEEK_ROUTE_GUIDANCE_HOME_COLLAPSED_SUMMARY,
  FIRST_WEEK_ROUTE_GUIDANCE_HOME_SUMMARY,
} from "@/lib/first-week-route-guidance";
import {
  firstWeekRouteGuidanceHomeDisclosureHrefFromSearch,
  parseFirstWeekRouteGuidanceHomeOpenFromSearch,
} from "@/lib/operator/first-week-route-guidance-home-disclosure-url";
import {
  OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS,
  readOperatorHomeDisclosureExpanded,
  writeOperatorHomeDisclosureExpanded,
} from "@/lib/operator/operator-home-disclosure-storage";

type FirstWeekRouteGuidanceHomeDisclosureProps = {
  readonly children: React.ReactNode;
};

/** Home variant first-week guidance with URL-synced disclosure state. */
export function FirstWeekRouteGuidanceHomeDisclosure(props: FirstWeekRouteGuidanceHomeDisclosureProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const firstWeekRouteGuidanceHomeOpenParam = searchParams.get("firstWeekRouteGuidanceHomeOpen");
  const [homeGuidanceExpanded, setHomeGuidanceExpandedState] = useState(() => {
    if (parseFirstWeekRouteGuidanceHomeOpenFromSearch(firstWeekRouteGuidanceHomeOpenParam)) {
      return true;
    }

    return readOperatorHomeDisclosureExpanded(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.firstWeekGuidance, false);
  });

  const setHomeGuidanceExpanded = useCallback(
    (open: boolean) => {
      setHomeGuidanceExpandedState(open);
      writeOperatorHomeDisclosureExpanded(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.firstWeekGuidance, open);
      router.replace(
        firstWeekRouteGuidanceHomeDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setHomeGuidanceExpandedState(parseFirstWeekRouteGuidanceHomeOpenFromSearch(firstWeekRouteGuidanceHomeOpenParam));
  }, [firstWeekRouteGuidanceHomeOpenParam]);

  return (
    <OperatorHomeDisclosureSection
      title={FIRST_WEEK_ROUTE_GUIDANCE_HOME_SUMMARY}
      titleId="first-week-guidance-home"
      sectionTestId="first-week-route-guidance-home"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.firstWeekGuidance}
      defaultExpanded={false}
      expanded={homeGuidanceExpanded}
      onExpandedChange={setHomeGuidanceExpanded}
      collapsedSummary={FIRST_WEEK_ROUTE_GUIDANCE_HOME_COLLAPSED_SUMMARY}
    >
      {props.children}
    </OperatorHomeDisclosureSection>
  );
}
