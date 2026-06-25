import Link from "next/link";

import { BeforeAfterDeltaPanel } from "@/components/BeforeAfterDeltaPanel";
import { FirstWeekRouteGuidance } from "@/components/FirstWeekRouteGuidance";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
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
import { RunsPageBuyerHelpTip } from "@/components/RunsPageBuyerHelpTip";
import { ShortcutHint } from "@/components/ShortcutHint";
import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv, isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";
import {
  BUYER_RUNS_DASHBOARD_RECENT_SUMMARY,
  BUYER_RUNS_LIST_GLOSSARY_LEAD,
} from "@/lib/buyer-polish-copy";
import { RUNS_LIST_PAGE_SUBTITLE, RUNS_LIST_PAGE_TITLES } from "@/lib/i18n";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { RunsPageModel } from "./runs-page-model";

type Props = {
  readonly model: RunsPageModel;
};

/** Server component: reviews index body (list fetch happens in `loadRunsPageModel`). */
export function RunsPageView(props: Props) {
  const m = props.model;
  const loadFailure = m.loadFailure;
  const malformedMessage = m.malformedMessage;

  return (
    <OperatorPageContainer variant="dashboard">
      <OperatorWelcomeOnboarding serverEligible={m.welcomeOnboardingEligible} />
      <OperatorPageHeader
        title={
          isBuyerPolishedOperatorShellEnv()
            ? RUNS_LIST_PAGE_TITLES.buyerPolished
            : RUNS_LIST_PAGE_TITLES.fullOperator
        }
        subtitle={RUNS_LIST_PAGE_SUBTITLE}
        metadata={
          <>
            <span>{m.projectTitle}</span>
            {isBuyerPolishedOperatorShellEnv() ? null : <RunsListProofHeadline />}
          </>
        }
        helpKey="runs-list-overview"
        docsPageKey="/runs"
      />
      {!isBuyerPolishedOperatorShellEnv() ? (
        <div className="mt-3 max-w-3xl">
          <FirstWeekRouteGuidance variant="reviews-list" />
        </div>
      ) : null}
      {isBuyerPolishedOperatorShellEnv() && m.totalCount > 0 ? (
        <p className="max-w-3xl leading-relaxed text-neutral-700 dark:text-neutral-300">
          {m.totalCount === 1 && m.runs[0]?.hasGoldenManifest === true ? (
            <span className="inline-flex flex-wrap items-center gap-x-1">
              {BUYER_RUNS_DASHBOARD_RECENT_SUMMARY}
              <RunsPageBuyerHelpTip variant="sample-workspace" />
            </span>
          ) : (
            <span className="inline-flex flex-wrap items-center gap-x-1">
              <GlossaryTooltip termKey="review_package">{BUYER_RUNS_LIST_GLOSSARY_LEAD}</GlossaryTooltip>
              <RunsPageBuyerHelpTip variant="search" />
            </span>
          )}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!isBuyerSafeDemoMarketingChromeEnv() ? (
          <div className="inline-flex items-center gap-1.5">
            <Button variant="outline" size="sm" asChild>
              <Link href="/reviews/new" className="no-underline">
                Start architecture review
              </Link>
            </Button>
            {isBuyerPolishedOperatorShellEnv() ? null : (
              <ShortcutHint shortcut="Alt+N" className={OPERATOR_TYPOGRAPHY.helper} />
            )}
          </div>
        ) : null}
        {!isBuyerSafeDemoMarketingChromeEnv() && m.totalCount > 0 && !isBuyerPolishedOperatorShellEnv() ? (
          <Button variant="outline" size="sm" asChild>
            <Link href="/compare" className="no-underline">
              Compare two reviews
            </Link>
          </Button>
        ) : null}
      </div>

      {m.usedStaticRunsFallback && !isBuyerPolishedOperatorShellEnv() ? (
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
            <strong>Reviews list response was not usable.</strong>
            <p className="mt-2">{malformedMessage}</p>
            <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
              The HTTP call may have succeeded, but the JSON did not match the expected paged review summary shape. This is distinct from
              an empty project (zero reviews).
            </p>
          </OperatorMalformedCallout>
          <OperatorTryNext>The server response was unexpected. If this persists, contact support.</OperatorTryNext>
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
