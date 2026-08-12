import { cn } from "@/lib/utils";
import Link from "next/link";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorBrandedTransientFailure } from "@/components/OperatorBrandedTransientFailure";
import { OperatorErrorUiReferenceLine } from "@/components/OperatorErrorUiReferenceLine";
import {
  OperatorErrorCallout,
  OperatorMalformedCallout,
} from "@/components/OperatorShellMessage";
import {
  BUYER_MANIFEST_SUMMARY_LOAD_ERROR_HEADING,
  BUYER_MANIFEST_SUMMARY_MALFORMED_HEADING,
  BUYER_MANIFEST_SUMMARY_MISSING_HEADING,
} from "@/lib/buyer/buyer-polish-copy";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiTransientLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type ManifestDetailPageErrorFrameProps = {
  readonly buyerPolishedLayout: boolean;
  readonly children: React.ReactNode;
};

/** Shared chrome for manifest summary error states (back link + page title). */
export function ManifestDetailPageErrorFrame(props: ManifestDetailPageErrorFrameProps) {
  return (
    <div className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <Link className={OPERATOR_LINK.nav} href="/architecture/reviews">
          Back to reviews
        </Link>
      </p>
      <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>
        {props.buyerPolishedLayout ? "Architecture review" : "Finalized architecture review"}
      </h1>
      {props.children}
    </div>
  );
}

function ManifestDetailPageErrorFooterLinks() {
  return (
    <p className={cn(OPERATOR_TYPOGRAPHY.body)}>
      <Link className={OPERATOR_LINK.inline} href="/architecture/reviews">Reviews</Link>
    </p>
  );
}

export function ManifestDetailSummaryLoadErrorView(props: {
  readonly buyerPolishedLayout: boolean;
  readonly summaryFailure: ApiLoadFailureState;
}) {
  if (isApiTransientLoadFailure(props.summaryFailure)) {
    return (
      <ManifestDetailPageErrorFrame buyerPolishedLayout={props.buyerPolishedLayout}>
        <OperatorBrandedTransientFailure
          failure={props.summaryFailure}
          retryLabel="Retry loading review record"
        />
      </ManifestDetailPageErrorFrame>
    );
  }

  return (
    <ManifestDetailPageErrorFrame buyerPolishedLayout={props.buyerPolishedLayout}>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {props.buyerPolishedLayout
          ? BUYER_MANIFEST_SUMMARY_LOAD_ERROR_HEADING
          : "Review record summary could not be loaded."}
      </p>
      <OperatorApiProblem
        problem={props.summaryFailure.problem}
        fallbackMessage={props.summaryFailure.message}
        correlationId={props.summaryFailure.correlationId}
      />
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Try reloading, or return to the reviews list, open a review, then the signed review record from review detail.
      </p>
      <ManifestDetailPageErrorFooterLinks />
    </ManifestDetailPageErrorFrame>
  );
}

export function ManifestDetailSummaryMalformedView(props: {
  readonly buyerPolishedLayout: boolean;
  readonly message: string;
}) {
  return (
    <ManifestDetailPageErrorFrame buyerPolishedLayout={props.buyerPolishedLayout}>
      <OperatorMalformedCallout>
        <strong>
          {props.buyerPolishedLayout
            ? BUYER_MANIFEST_SUMMARY_MALFORMED_HEADING
            : "Review record summary response was not usable."}
        </strong>
        <p className="mt-2">{props.message}</p>
      </OperatorMalformedCallout>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        The server response was unexpected. If this persists, contact support.
      </p>
      <ManifestDetailPageErrorFooterLinks />
    </ManifestDetailPageErrorFrame>
  );
}

export function ManifestDetailSummaryMissingView(props: { readonly buyerPolishedLayout: boolean }) {
  return (
    <ManifestDetailPageErrorFrame buyerPolishedLayout={props.buyerPolishedLayout}>
      <OperatorErrorCallout>
        <strong>
          {props.buyerPolishedLayout ? BUYER_MANIFEST_SUMMARY_MISSING_HEADING : "Review record summary missing."}
        </strong>
        <p className="mt-2">
          The response did not include review record details. Try reloading once, or return from review detail instead of a
          pasted link.
        </p>
        <OperatorErrorUiReferenceLine />
      </OperatorErrorCallout>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        If this continues, try reloading, or return to the reviews list and open a review, then the signed review record.
      </p>
      <ManifestDetailPageErrorFooterLinks />
    </ManifestDetailPageErrorFrame>
  );
}
