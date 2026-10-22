"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { RunDetailArchitectureSummaryCard } from "@/components/reviews/RunDetailArchitectureSummaryCard";
import {
  REVIEW_DETAIL_TAB_PARAM,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";

export type RunDetailArchitectureSummaryRailClientProps = {
  readonly architectureTitle: string | null;
  readonly architectureText: string | null;
  readonly evidenceCount: number;
  readonly hasSubmittedArchitecture: boolean;
};

export function RunDetailArchitectureSummaryRailClient(
  props: RunDetailArchitectureSummaryRailClientProps,
): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigateTab = useCallback(
    (tab: ReviewDetailTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(REVIEW_DETAIL_TAB_PARAM, tab);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <RunDetailArchitectureSummaryCard
      architectureTitle={props.architectureTitle}
      architectureText={props.architectureText}
      evidenceCount={props.evidenceCount}
      userAssertions={null}
      hasSubmittedArchitecture={props.hasSubmittedArchitecture}
      onNavigateTab={navigateTab}
    />
  );
}
