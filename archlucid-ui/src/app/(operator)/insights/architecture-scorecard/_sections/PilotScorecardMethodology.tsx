"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parsePilotScorecardMethodologyOpenFromSearch,
  pilotScorecardMethodologyDisclosureHrefFromSearch,
} from "@/lib/insights/pilot-scorecard-methodology-disclosure-url";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";
import { cn } from "@/lib/utils";

export type PilotScorecardMethodologyProps = {
  readonly methodologyLines: readonly string[];
};

export function PilotScorecardMethodology({ methodologyLines }: PilotScorecardMethodologyProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const pilotScorecardMethodologyOpenParam = searchParams.get("pilotScorecardMethodologyOpen");
  const [methodologyOpen, setMethodologyOpenState] = useState(() =>
    parsePilotScorecardMethodologyOpenFromSearch(pilotScorecardMethodologyOpenParam),
  );

  const syncMethodologyOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(pilotScorecardMethodologyDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setMethodologyOpen = useCallback(
    (open: boolean) => {
      setMethodologyOpenState(open);
      syncMethodologyOpenToUrl(open);
    },
    [syncMethodologyOpenToUrl],
  );

  useEffect(() => {
    setMethodologyOpenState(parsePilotScorecardMethodologyOpenFromSearch(pilotScorecardMethodologyOpenParam));
  }, [pilotScorecardMethodologyOpenParam]);

  return (
    <CollapsibleSection
      title="How this is calculated"
      sectionTestId="review-scorecard-methodology"
      open={methodologyOpen}
      onToggle={setMethodologyOpen}
    >
      <ul className={cn("m-0 list-disc space-y-2 ps-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {methodologyLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
        <li>
          ROI estimates apply a 50% review-time reduction lever once all three assumptions are provided.{" "}
          <Link href={SPONSOR_REPORT_ROI_SUMMARY_PATH} className={OPERATOR_LINK.inline}>
            See ROI summary
          </Link>{" "}
          for related value reporting.
        </li>
      </ul>
    </CollapsibleSection>
  );
}
