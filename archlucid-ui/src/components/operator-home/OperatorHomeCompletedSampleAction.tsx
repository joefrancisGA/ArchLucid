"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type SetStateAction } from "react";

import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorHomeFeaturedSamplePickerDialog } from "@/components/operator-home/OperatorHomeFeaturedSamplePickerDialog";
import { OperatorHomeNavigateLoadingButton } from "@/components/operator-home/OperatorHomeNavigateLoadingButton";
import { useFeaturedCompletedSampleQuery } from "@/hooks/use-featured-completed-sample-query";
import {
  OPERATOR_HOME_CHOOSE_SAMPLE_REVIEW_CTA,
  OPERATOR_HOME_COMPLETED_SAMPLE_FETCH_ERROR_MESSAGE,
  OPERATOR_HOME_CONTACT_WORKSPACE_OWNER_HINT,
  OPERATOR_HOME_MISSING_COMPLETED_SAMPLE_MESSAGE,
  OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { featuredCompletedSampleReviewHref } from "@/lib/fetch-tenant-homepage-settings-client";
import {
  operatorHomeSamplePickerHrefFromSearch,
  parseOperatorHomeSamplePickerOpenFromSearch,
} from "@/lib/operator-home/operator-home-sample-picker-url";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { resolveOperatorHomeCompletedSampleFallback } from "@/lib/resolve-operator-home-completed-sample-fallback";
import { OPERATOR_HOME_OPENING_COMPLETED_REVIEW_LABEL } from "@/lib/review-start-progress-copy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OperatorHomeCompletedSampleActionProps = {
  readonly compact?: boolean;
  readonly onOpenSample?: () => void;
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

/** Opens the workspace-owner-selected completed sample or a safe missing-selection state. */
export function OperatorHomeCompletedSampleAction(
  props: OperatorHomeCompletedSampleActionProps,
): React.JSX.Element {
  const sampleQuery = useFeaturedCompletedSampleQuery();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const samplePickerOpenParam = searchParams.get("samplePickerOpen");
  const [pickerOpen, setPickerOpenState] = useState(() =>
    parseOperatorHomeSamplePickerOpenFromSearch(samplePickerOpenParam),
  );

  const syncSamplePickerOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(operatorHomeSamplePickerHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setPickerOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setPickerOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncSamplePickerOpenToUrl(next);

        return next;
      });
    },
    [syncSamplePickerOpenToUrl],
  );

  const canChooseSample = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const sample = sampleQuery.data;
  const showcaseFallback = resolveOperatorHomeCompletedSampleFallback();
  const sampleVariant = props.pagePrimaryOwnedElsewhere === true ? "outline" : "primary";

  function renderSampleOpenLink(href: string, testId: string): React.JSX.Element {
    if (props.pagePrimaryOwnedElsewhere === true) {
      return (
        <Link
          href={href}
          className={cn("font-medium", OPERATOR_LINK.nav)}
          data-testid={testId}
          onClick={props.onOpenSample}
        >
          {OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA}
        </Link>
      );
    }

    return (
      <OperatorHomeNavigateLoadingButton
        variant={sampleVariant}
        size="sm"
        className={cn("h-8 w-fit", props.compact === true && "h-7")}
        href={href}
        idleLabel={OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA}
        loadingLabel={OPERATOR_HOME_OPENING_COMPLETED_REVIEW_LABEL}
        onNavigate={props.onOpenSample}
        data-testid={testId}
      />
    );
  }

  if (sampleQuery.isPending) {
    return (
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")} aria-live="polite">
        Loading completed sample…
      </p>
    );
  }

  if (sampleQuery.isError) {
    if (showcaseFallback !== null) {
      return renderSampleOpenLink(showcaseFallback.href, "operator-home-explore-completed-review-cta");
    }

    return (
      <p
        className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}
        data-testid="operator-home-completed-sample-fetch-error"
      >
        {OPERATOR_HOME_COMPLETED_SAMPLE_FETCH_ERROR_MESSAGE}
      </p>
    );
  }

  if (sample === undefined) {
    if (showcaseFallback !== null) {
      return renderSampleOpenLink(showcaseFallback.href, "operator-home-explore-completed-review-cta");
    }

    return (
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}>
        {OPERATOR_HOME_MISSING_COMPLETED_SAMPLE_MESSAGE}
      </p>
    );
  }

  if (sample.isAvailable && sample.selectedRunId !== null) {
    return renderSampleOpenLink(
      featuredCompletedSampleReviewHref(sample.selectedRunId),
      "operator-home-explore-completed-review-cta",
    );
  }

  if (showcaseFallback !== null) {
    return renderSampleOpenLink(showcaseFallback.href, "operator-home-explore-completed-review-cta");
  }

  return (
    <div className="space-y-2" data-testid="operator-home-missing-completed-sample">
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}>
        {OPERATOR_HOME_MISSING_COMPLETED_SAMPLE_MESSAGE}
      </p>
      {canChooseSample ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-fit"
            data-testid="operator-home-choose-sample-review"
            onClick={() => setPickerOpen(true)}
          >
            {OPERATOR_HOME_CHOOSE_SAMPLE_REVIEW_CTA}
          </Button>
          <OperatorHomeFeaturedSamplePickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
        </>
      ) : (
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}>
          {OPERATOR_HOME_CONTACT_WORKSPACE_OWNER_HINT}
        </p>
      )}
    </div>
  );
}
