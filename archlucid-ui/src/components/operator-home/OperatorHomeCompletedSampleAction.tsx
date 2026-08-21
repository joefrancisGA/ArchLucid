"use client";

import { useState } from "react";

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
import { getBuyerSafeReviewsTableLink } from "@/lib/buyer/buyer-safe-review-navigation";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { featuredCompletedSampleReviewHref } from "@/lib/fetch-tenant-homepage-settings-client";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { OPERATOR_HOME_OPENING_COMPLETED_REVIEW_LABEL } from "@/lib/review-start-progress-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OperatorHomeCompletedSampleActionProps = {
  readonly compact?: boolean;
  readonly onOpenSample?: () => void;
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

function resolveShowcaseCompletedSampleFallback(): { readonly href: string; readonly label: string } | null {
  if (!isStaticDemoPayloadFallbackEnabled()) {
    return null;
  }

  return getBuyerSafeReviewsTableLink(SHOWCASE_STATIC_DEMO_RUN_ID);
}

/** Opens the workspace-owner-selected completed sample or a safe missing-selection state. */
export function OperatorHomeCompletedSampleAction(
  props: OperatorHomeCompletedSampleActionProps,
): React.JSX.Element {
  const sampleQuery = useFeaturedCompletedSampleQuery();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const [pickerOpen, setPickerOpen] = useState(false);

  const canChooseSample = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const sample = sampleQuery.data;
  const showcaseFallback = resolveShowcaseCompletedSampleFallback();
  const sampleVariant = props.pagePrimaryOwnedElsewhere === true ? "outline" : "primary";

  if (sampleQuery.isPending) {
    return (
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")} aria-live="polite">
        Loading completed sample…
      </p>
    );
  }

  if (sampleQuery.isError) {
    if (showcaseFallback !== null) {
      return (
        <OperatorHomeNavigateLoadingButton
          variant={sampleVariant}
          size="sm"
          className={cn("h-8 w-fit", props.compact === true && "h-7")}
          href={showcaseFallback.href}
          idleLabel={OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA}
          loadingLabel={OPERATOR_HOME_OPENING_COMPLETED_REVIEW_LABEL}
          onNavigate={props.onOpenSample}
          data-testid="operator-home-explore-completed-review-cta"
        />
      );
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
      return (
        <OperatorHomeNavigateLoadingButton
          variant={sampleVariant}
          size="sm"
          className={cn("h-8 w-fit", props.compact === true && "h-7")}
          href={showcaseFallback.href}
          idleLabel={OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA}
          loadingLabel={OPERATOR_HOME_OPENING_COMPLETED_REVIEW_LABEL}
          onNavigate={props.onOpenSample}
          data-testid="operator-home-explore-completed-review-cta"
        />
      );
    }

    return (
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}>
        {OPERATOR_HOME_MISSING_COMPLETED_SAMPLE_MESSAGE}
      </p>
    );
  }

  if (sample.isAvailable && sample.selectedRunId !== null) {
    return (
      <OperatorHomeNavigateLoadingButton
        variant={sampleVariant}
        size="sm"
        className={cn("h-8 w-fit", props.compact === true && "h-7")}
        href={featuredCompletedSampleReviewHref(sample.selectedRunId)}
        idleLabel={OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA}
        loadingLabel={OPERATOR_HOME_OPENING_COMPLETED_REVIEW_LABEL}
        onNavigate={props.onOpenSample}
        data-testid="operator-home-explore-completed-review-cta"
      />
    );
  }

  if (showcaseFallback !== null) {
    return (
      <OperatorHomeNavigateLoadingButton
        variant={sampleVariant}
        size="sm"
        className={cn("h-8 w-fit", props.compact === true && "h-7")}
        href={showcaseFallback.href}
        idleLabel={OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA}
        loadingLabel={OPERATOR_HOME_OPENING_COMPLETED_REVIEW_LABEL}
        onNavigate={props.onOpenSample}
        data-testid="operator-home-explore-completed-review-cta"
      />
    );
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
