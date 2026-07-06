import { cn } from "@/lib/utils";
import Link from "next/link";

import { BeforeAfterDeltaPanel } from "@/components/BeforeAfterDeltaPanel";
import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import { OperatorMalformedCallout, OperatorTryNext } from "@/components/OperatorShellMessage";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { OperatorWelcomeOnboarding } from "@/components/OperatorWelcomeOnboarding";
import { RunsIndexBeforeAfterPanel } from "@/components/RunsIndexBeforeAfterPanel";
import { RunsListAggregateErrorBoundary } from "@/components/RunsListAggregateErrorBoundary";
import { RunsListEmptyState } from "@/components/RunsListEmptyState";
import { RunsListProofHeadline } from "@/components/RunsListProofHeadline";
import { ShortcutHint } from "@/components/ShortcutHint";
import { Button } from "@/components/ui/button";
import { isBuyerSafeDemoMarketingChromeEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import {
  BUYER_RUNS_LIST_MALFORMED_BODY,
  BUYER_RUNS_LIST_MALFORMED_HEADING,
} from "@/lib/buyer-polish-copy";
import { RUNS_LIST_PAGE_SUBTITLE, RUNS_LIST_PAGE_TITLES } from "@/lib/i18n";
import { OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";

import type { RunsPageModel } from "./runs-page-model";

type Props = {
  readonly model: RunsPageModel;
};

/** Server component: reviews index body (list fetch happens in `loadRunsPageModel`). */
export function RunsPageView(props: Props) {
  const m = props.model;
  const loadFailure = m.loadFailure;
  const malformedMessage = m.malformedMessage;
  const isDev = process.env.NODE_ENV === "development";

  return (
    <OperatorPageContainer variant="dashboard">
      <OperatorWelcomeOnboarding serverEligible={m.welcomeOnboardingEligible} />
      <OperatorPageHeader
        title={
          isOperatorExperienceFullShellEnv()
            ? RUNS_LIST_PAGE_TITLES.fullOperator
            : RUNS_LIST_PAGE_TITLES.buyerPolished
        }
        subtitle={RUNS_LIST_PAGE_SUBTITLE}
        metadata={
          <>
            {m.projectId !== "default" ? (
              <span
                className={cn(OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
                data-testid="runs-page-project-label"
              >
                <InlineGuidanceText text={m.projectTitle} />
              </span>
            ) : null}
            {isOperatorExperienceFullShellEnv() ? <RunsListProofHeadline /> : null}
          </>
        }
        helpKey="runs-list-overview"
        docsPageKey="/runs"
      />
      {!isBuyerSafeDemoMarketingChromeEnv() && m.totalCount > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5">
            <Button variant="primary" size="sm" asChild>
              <Link href="/reviews/new" className="no-underline" data-testid="runs-page-start-review">
                Start architecture review
              </Link>
            </Button>
            {isOperatorExperienceFullShellEnv() ? (
              <ShortcutHint shortcut="Alt+N" className={OPERATOR_TYPOGRAPHY.helper} />
            ) : null}
          </div>
          {isOperatorExperienceFullShellEnv() ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/compare" className="no-underline">
                Compare two reviews
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      {m.usedStaticRunsFallback && isOperatorExperienceFullShellEnv() ? (
        <div className="mt-4 max-w-3xl">
          <OperatorDemoStaticBanner />
        </div>
      ) : null}

      {loadFailure === null && malformedMessage === null ? <BeforeAfterDeltaPanel variant="top" /> : null}

      {loadFailure === null && malformedMessage === null && m.firstCommittedRunId !== null ? (
        <RunsIndexBeforeAfterPanel committedRunId={m.firstCommittedRunId} />
      ) : null}

      {loadFailure ? (
        <>
          <OperatorApiProblem
            problem={loadFailure.problem}
            fallbackMessage={loadFailure.message}
            correlationId={loadFailure.correlationId}
          />
          <OperatorTryNext>The reviews list could not be loaded. Check your connection and try reloading.</OperatorTryNext>
        </>
      ) : null}

      {!loadFailure && malformedMessage ? (
        <>
          <OperatorMalformedCallout>
            <strong>{BUYER_RUNS_LIST_MALFORMED_HEADING}</strong>
            <p className="mt-2">{isDev ? malformedMessage : BUYER_RUNS_LIST_MALFORMED_BODY}</p>
            {isDev ? (
              <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
                The HTTP call may have succeeded, but the JSON did not match the expected paged review summary shape. This is distinct from
                an empty project (zero reviews).
              </p>
            ) : null}
          </OperatorMalformedCallout>
          {isDev ? (
            <OperatorTryNext>The server response was unexpected. If this persists, contact support.</OperatorTryNext>
          ) : null}
        </>
      ) : null}

      {loadFailure === null && !malformedMessage && m.totalCount === 0 ? <RunsListEmptyState /> : null}

      {!loadFailure && !malformedMessage && m.totalCount > 0 ? (
        <RunsListAggregateErrorBoundary
          runs={m.runs}
          projectId={m.projectId}
          page={m.page}
          pageSize={m.pageSize}
          totalCount={m.totalCount}
          nextCursor={m.nextCursorForClient}
        />
      ) : null}
    </OperatorPageContainer>
  );
}
