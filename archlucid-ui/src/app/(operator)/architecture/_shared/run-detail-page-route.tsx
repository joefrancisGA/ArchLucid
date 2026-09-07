import { notFound, redirect } from "next/navigation";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorBrandedNotFound } from "@/components/operator/OperatorBrandedNotFound";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ReviewPackageLoadFailureView } from "@/components/ReviewPackageLoadFailureView";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture/architecture-workflow-intent";
import {
  isNestedReviewArchitectureMismatch,
  resolveWorkingPeerReviewRedirectHref,
} from "@/lib/architecture/working-architecture-review-routes";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import {
  isFromGenerationSearchParam,
  REVIEW_PACKAGE_OPEN_FAILURE_HEADING,
} from "@/lib/review-generation-handoff";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";
import { cn } from "@/lib/utils";
import { readServerWorkingModeFromBffSession } from "@/lib/workspace-mode/read-server-working-mode";

import { loadRunDetailPageModel } from "../reviews/[reviewId]/_sections/load-run-detail-page-model";
import { RunDetailPageFetchErrorView } from "../reviews/[reviewId]/_sections/RunDetailPageFetchErrorView";
import { RunDetailPageMalformedResponseView } from "../reviews/[reviewId]/_sections/RunDetailPageMalformedResponseView";
import { RunDetailPageView } from "../reviews/[reviewId]/_sections/RunDetailPageView";

const runDetailShellClassName = cn(OPERATOR_LAYOUT.sectionStack, "px-1 py-2 sm:px-0");

export type RunDetailPageRouteSearchParams = {
  readonly fromGeneration?: string | string[];
  readonly intent?: string | string[];
};

export type RunDetailPageRouteProps = {
  readonly reviewId: string;
  readonly expectedArchitectureId?: string | null;
  readonly attemptedRoute: string;
  readonly searchParams: RunDetailPageRouteSearchParams;
  readonly pathnameForRedirect?: string;
  readonly searchForRedirect?: string | null;
};

function buildSearchString(searchParams: RunDetailPageRouteSearchParams): string {
  const params = new URLSearchParams();

  if (searchParams.fromGeneration !== undefined) {
    const value = Array.isArray(searchParams.fromGeneration)
      ? searchParams.fromGeneration[0]
      : searchParams.fromGeneration;

    if (value !== undefined && value.trim().length > 0) {
      params.set("fromGeneration", value);
    }
  }

  if (searchParams.intent !== undefined) {
    const value = Array.isArray(searchParams.intent) ? searchParams.intent[0] : searchParams.intent;

    if (value !== undefined && value.trim().length > 0) {
      params.set("intent", value);
    }
  }

  const serialized = params.toString();

  return serialized.length > 0 ? serialized : "";
}

/** Shared run-detail server route for peer and nested Working review jobs (AO-04 / AO-06). */
export async function RunDetailPageRoute(props: RunDetailPageRouteProps): Promise<React.JSX.Element> {
  const runId = props.reviewId.trim();
  const fromGeneration = isFromGenerationSearchParam(props.searchParams.fromGeneration);
  const intentParam = Array.isArray(props.searchParams.intent)
    ? props.searchParams.intent[0]
    : props.searchParams.intent;
  const fromArchitectureCreation =
    fromGeneration && intentParam?.trim() === CREATE_ARCHITECTURE_INTENT;

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  const result = await loadRunDetailPageModel(runId);

  if (result.kind === "success") {
    const runArchitectureId = result.model.resolvedDetail.run.architectureId ?? null;
    const expectedArchitectureId = props.expectedArchitectureId?.trim() ?? "";

    if (
      expectedArchitectureId.length > 0 &&
      isNestedReviewArchitectureMismatch(expectedArchitectureId, runArchitectureId)
    ) {
      notFound();
    }

    const workingMode = await readServerWorkingModeFromBffSession();
    const linkedArchitectureId = runArchitectureId?.trim() ?? "";

    if (
      workingMode &&
      linkedArchitectureId.length > 0 &&
      (expectedArchitectureId.length === 0)
    ) {
      const pathname = props.pathnameForRedirect ?? props.attemptedRoute.split("?")[0] ?? "";
      const redirectTarget = resolveWorkingPeerReviewRedirectHref({
        architectureId: linkedArchitectureId,
        reviewId: runId,
        pathname,
        search: props.searchForRedirect ?? buildSearchString(props.searchParams),
      });

      if (redirectTarget !== pathname) {
        redirect(redirectTarget);
      }
    }
  }

  if (result.kind === "not-found") {
    if (fromGeneration || result.reason === "workspace-mismatch") {
      return (
        <OperatorPageContainer variant="dashboard" className={runDetailShellClassName} data-testid="run-detail-load-failure">
          <OperatorPageHeader title={REVIEW_PACKAGE_OPEN_FAILURE_HEADING} headingLevel="h1" />
          <ReviewPackageLoadFailureView
            runId={runId}
            fromGeneration={fromGeneration}
            notFoundReason={result.reason}
            attemptedRoute={props.attemptedRoute}
          />
        </OperatorPageContainer>
      );
    }

    return (
      <OperatorPageContainer variant="dashboard" className={runDetailShellClassName}>
        <OperatorBrandedNotFound
          showProcessingHint
          retryLabel="Retry loading review"
          showSampleReviewLink
          variant="review"
        />
      </OperatorPageContainer>
    );
  }

  if (result.kind === "fetch-error") {
    return (
      <RunDetailPageFetchErrorView
        runId={runId}
        fromGeneration={fromGeneration}
        attemptedRoute={props.attemptedRoute}
        loadFailure={result.loadFailure}
        fallbackMessage={result.fallbackMessage}
      />
    );
  }

  if (result.kind === "malformed-response") {
    return <RunDetailPageMalformedResponseView message={result.message} />;
  }

  return <RunDetailPageView model={result.model} fromArchitectureCreation={fromArchitectureCreation} />;
}
