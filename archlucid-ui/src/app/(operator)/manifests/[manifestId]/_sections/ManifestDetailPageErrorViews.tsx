import Link from "next/link";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorBrandedTransientFailure } from "@/components/OperatorBrandedTransientFailure";
import { OperatorErrorUiReferenceLine } from "@/components/OperatorErrorUiReferenceLine";
import {
  OperatorErrorCallout,
  OperatorMalformedCallout,
} from "@/components/OperatorShellMessage";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiTransientLoadFailure } from "@/lib/api-load-failure";

type ManifestDetailPageErrorFrameProps = {
  readonly buyerPolishedLayout: boolean;
  readonly children: React.ReactNode;
};

/** Shared chrome for manifest summary error states (breadcrumb + page title). */
export function ManifestDetailPageErrorFrame(props: ManifestDetailPageErrorFrameProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-0">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-400">
        <Link className="text-teal-800 underline dark:text-teal-300" href="/">
          Home
        </Link>
        {" · "}
        <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
          Reviews
        </Link>
      </nav>
      <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        {props.buyerPolishedLayout ? "Architecture review package" : "Finalized Architecture Manifest"}
      </h1>
      {props.children}
    </div>
  );
}

function ManifestDetailPageErrorFooterLinks() {
  return (
    <p className="text-sm">
      <Link href="/">Home</Link>
      {" · "}
      <Link href="/reviews?projectId=default">Reviews</Link>
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
          retryLabel="Retry loading manifest"
        />
      </ManifestDetailPageErrorFrame>
    );
  }

  return (
    <ManifestDetailPageErrorFrame buyerPolishedLayout={props.buyerPolishedLayout}>
      <p className="m-0 text-sm font-semibold">Manifest summary could not be loaded.</p>
      <OperatorApiProblem
        problem={props.summaryFailure.problem}
        fallbackMessage={props.summaryFailure.message}
        correlationId={props.summaryFailure.correlationId}
      />
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
        Try reloading, or return to the reviews list, open a review, then the manifest from review detail.
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
        <strong>Manifest summary response was not usable.</strong>
        <p className="mt-2">{props.message}</p>
      </OperatorMalformedCallout>
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
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
        <strong>Manifest summary missing.</strong>
        <p className="mt-2">
          The response did not include manifest details. Try reloading once, or return from review detail instead of a
          pasted link.
        </p>
        <OperatorErrorUiReferenceLine />
      </OperatorErrorCallout>
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
        If this continues, try reloading, or return to the reviews list and open a review, then the manifest.
      </p>
      <ManifestDetailPageErrorFooterLinks />
    </ManifestDetailPageErrorFrame>
  );
}
