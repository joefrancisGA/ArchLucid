import Link from "next/link";

import { BeforeAfterDeltaPanel } from "@/components/BeforeAfterDeltaPanel";
import { EmptyState } from "@/components/EmptyState";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import { OperatorMalformedCallout, OperatorTryNext } from "@/components/OperatorShellMessage";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { OperatorWelcomeOnboarding } from "@/components/OperatorWelcomeOnboarding";
import { RunsIndexBeforeAfterPanel } from "@/components/RunsIndexBeforeAfterPanel";
import { RunsListAggregateErrorBoundary } from "@/components/RunsListAggregateErrorBoundary";
import { RunsListProofHeadline } from "@/components/RunsListProofHeadline";
import { RunsPageBuyerHelpTip } from "@/components/RunsPageBuyerHelpTip";
import { ShortcutHint } from "@/components/ShortcutHint";
import { Button } from "@/components/ui/button";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { isBuyerPolishedOperatorShellEnv, isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";
import { RUNS_EMPTY } from "@/lib/empty-state-presets";

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
    <div>
      <OperatorWelcomeOnboarding serverEligible={m.welcomeOnboardingEligible} />
      <OperatorPageHeader
        title="Architecture Reviews"
        metadata={
          <>
            <span>{m.projectTitle}</span>
            {isBuyerPolishedOperatorShellEnv() ? null : <RunsListProofHeadline />}
          </>
        }
        helpKey="runs-list-overview"
        docsPageKey="/runs"
      />
      <p className="max-w-3xl leading-relaxed text-neutral-700 dark:text-neutral-300">
        {isBuyerPolishedOperatorShellEnv() ? (
          m.totalCount === 1 && m.runs[0]?.hasGoldenManifest === true ? (
            <>
              <span className="inline-flex flex-wrap items-center gap-x-1">
                One finalized review package is available in this example workspace.
                <RunsPageBuyerHelpTip variant="sample-workspace" />
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex flex-wrap items-center gap-x-1">
                Open an <GlossaryTooltip termKey="run">architecture review</GlossaryTooltip> for manifest, evidence,
                findings, and deliverables.
                <RunsPageBuyerHelpTip variant="search" />
              </span>
            </>
          )
        ) : (
          <>
            Open an <GlossaryTooltip termKey="run">architecture review</GlossaryTooltip> to inspect its manifest,
            artifacts, findings, and exports.
          </>
        )}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!isBuyerSafeDemoMarketingChromeEnv() ? (
          <div className="inline-flex items-center gap-1.5">
            <Button variant="outline" size="sm" asChild>
              <Link href="/reviews/new" className="no-underline">
                {isBuyerPolishedOperatorShellEnv() ? "New review" : "New request"}
              </Link>
            </Button>
            {isBuyerPolishedOperatorShellEnv() ? null : (
              <ShortcutHint shortcut="Alt+N" className="text-[0.75rem] text-neutral-500 dark:text-neutral-400" />
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

      {m.usedStaticRunsFallback ? (
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
            <p className="mt-2 text-sm">
              The HTTP call may have succeeded, but the JSON did not match the expected paged review summary shape. This is distinct from
              an empty project (zero reviews).
            </p>
          </OperatorMalformedCallout>
          <OperatorTryNext>The server response was unexpected. If this persists, contact support.</OperatorTryNext>
        </>
      ) : null}

      {loadFailure === null && !malformedMessage && m.totalCount === 0 ? (
        <>
          <div
            className="mt-4 max-w-prose rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm leading-snug text-neutral-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-neutral-200"
            data-testid="runs-empty-core-pilot-hint"
          >
            <strong className="font-semibold">Start your first architecture review:</strong> use{" "}
            <strong className="font-semibold">New review</strong> (or onboarding), run the pipeline, finalize, then review the package on
            architecture review detail (see{" "}
            <a
              href={toDocsBlobUrl("/docs/CORE_PILOT.md")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-teal-800 underline dark:text-teal-300"
            >
              CORE_PILOT.md
            </a>
            ). Compare, Replay, and heavy governance surfaces can wait until after your first committed package.
          </div>
          <EmptyState
            {...RUNS_EMPTY}
            title="No architecture reviews yet"
            description={
              isBuyerPolishedOperatorShellEnv()
                ? `Each review package is tracked in this workspace for manifest, evidence, findings, and deliverables.\n\n${RUNS_EMPTY.description}`
                : `Each architecture review is tracked as a run in the system. Your Run ID appears in metadata for support and diagnostics.\n\n${RUNS_EMPTY.description}`
            }
            actions={
              RUNS_EMPTY.actions === undefined
                ? undefined
                : RUNS_EMPTY.actions.map((action, index) =>
                    index === 0 ? { ...action, label: "Start Architecture Review" } : action,
                  )
            }
          />
        </>
      ) : null}

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
    </div>
  );
}
