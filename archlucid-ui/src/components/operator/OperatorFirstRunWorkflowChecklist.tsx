"use client";
import { cn } from "@/lib/utils";
import {
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";

import { InlineGuidance } from "@/components/InlineGuidance";
import Link from "next/link";
import type { ReactElement } from "react";

import {
  CORE_PILOT_FIRST_REVIEW_HEADING,
  CORE_PILOT_FIRST_REVIEW_HEADING_COMPACT,
  CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON,
  CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS,
  CORE_PILOT_WORKFLOW_SUMMARY_LINE,
  OPERATOR_SAMPLE_PACKAGE_SHORTCUTS_HEADING,
} from "@/lib/core-pilot-first-review-copy";
import { BUYER_FIRST_REVIEW_HELP_HREF } from "@/lib/first-review-90min-playbook-alignment";
import { OPERATOR_CO_ARCHITECT_CHECKLIST_KICKER } from "@/lib/operator/operator-co-architect-copy";
import { getShowcaseManifestHref, getShowcaseWalkthroughHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

import type { OperatorFirstRunWorkflowPanelViewModel } from "./use-operator-first-run-workflow-panel";

export type OperatorFirstRunWorkflowChecklistProps = {
  readonly panel: OperatorFirstRunWorkflowPanelViewModel;
};

export function OperatorFirstRunWorkflowChecklist(props: OperatorFirstRunWorkflowChecklistProps): ReactElement {
  const { panel } = props;

  if (!panel.hydrated) {
    return <div className="min-h-[100px] w-full" aria-hidden />;
  }

  if (panel.minimized) {
    return (
      <div data-onboarding="tour-core-pilot">
        <button
          type="button"
          onClick={panel.expand}
          aria-expanded={false}
          aria-controls="first-run-workflow-panel"
          className={cn("auth-panel-focus w-full cursor-pointer rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-left text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}
        >
          {CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON}
        </button>
      </div>
    );
  }

  if (panel.graduated && panel.allDone) {
    return (
      <section
        data-onboarding="tour-core-pilot"
        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-700 dark:bg-neutral-900/80"
        aria-labelledby="whats-next-heading"
      >
        <h2 id="whats-next-heading" className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          What&apos;s next
        </h2>
        <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          <InlineGuidance label="Optional">
            compare reviews, replay review process steps, or explore the architecture graph.
          </InlineGuidance>
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Link
            className={OPERATOR_LINK.stepPill}
            href="/insights/compare-two-reviews"
          >
            Compare
          </Link>
          <Link
            className={OPERATOR_LINK.stepPill}
            href="/internal/validate-route"
          >
            Replay
          </Link>
          <Link
            className={OPERATOR_LINK.stepPill}
            href="/insights/evidence-graph"
          >
            Graph
          </Link>
        </div>
        <button
          type="button"
          onClick={panel.revisitChecklist}
          className={cn("auth-panel-focus mt-2 cursor-pointer", OPERATOR_LINK.optional)}
        >
          Revisit checklist
        </button>
      </section>
    );
  }

  return (
    <section
      id="first-run-workflow-panel"
      data-onboarding="tour-core-pilot"
      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
      aria-labelledby="first-run-workflow-heading"
    >
      {panel.hasAnyRun ? (
        <div className="mb-3 rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-3 py-2.5">
          <h2 id="first-run-workflow-heading" className={cn("m-0 font-semibold text-al-text-primary dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {OPERATOR_SAMPLE_PACKAGE_SHORTCUTS_HEADING}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Link
              className={cn("inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600", OPERATOR_TYPOGRAPHY.helper)}
              href={`/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}
            >
              Open sample review
            </Link>
            <Link
              className={cn("inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600", OPERATOR_TYPOGRAPHY.helper)}
              href={getShowcaseManifestHref()}
            >
              {SIGNED_MANIFEST_LABEL} summary
            </Link>
            <Link
              className={cn("inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600", OPERATOR_TYPOGRAPHY.helper)}
              href={getShowcaseWalkthroughHref()}
            >
              Walkthrough
            </Link>
            <Link
              className={cn("inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600", OPERATOR_TYPOGRAPHY.helper)}
              href="/insights/compare-two-reviews"
            >
              Compare
            </Link>
            {panel.commitCtx.firstCommittedRunId !== null ? (
              <Link
                className={cn("inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600", OPERATOR_TYPOGRAPHY.helper)}
                href={`/architecture/reviews/${encodeURIComponent(panel.commitCtx.firstCommittedRunId)}`}
              >
                Open finalized review
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {panel.exploreCompletedOutput ? (
            <>
              <h2 id="first-run-workflow-heading" className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {OPERATOR_SAMPLE_PACKAGE_SHORTCUTS_HEADING}
              </h2>
              <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Claims Intake is the sample review — start with the finalized review record summary, then review detail or the read-only
                walkthrough. The checklist below is optional.
              </p>
              <p className={cn("m-0 mt-2 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={getShowcaseManifestHref()}>
                  View finalized record summary
                </Link>{" "}
                ·{" "}
                <Link
                  className={OPERATOR_BODY_INLINE_LINK_CLASS}
                  href={`/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}
                >
                  Open review detail
                </Link>{" "}
                ·{" "}
                <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={getShowcaseWalkthroughHref()}>
                  Read-only walkthrough
                </Link>
              </p>
            </>
          ) : !panel.hasAnyRun ? (
            <h2 id="first-run-workflow-heading" className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {CORE_PILOT_FIRST_REVIEW_HEADING}
            </h2>
          ) : (
            <h2
              id="first-run-workflow-heading"
              className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            >
              {CORE_PILOT_FIRST_REVIEW_HEADING_COMPACT}
            </h2>
          )}
          {!panel.exploreCompletedOutput ? (
            <>
              <p className={cn("m-0 mt-0.5 font-medium tracking-wide text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {CORE_PILOT_WORKFLOW_SUMMARY_LINE}
              </p>
              <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Guided first review:{" "}
                <Link
                  href={BUYER_FIRST_REVIEW_HELP_HREF}
                  className={OPERATOR_LINK.optional}
                  data-testid="first-review-90min-help-link"
                >
                  Your first architecture review
                </Link>
              </p>
              <details className="m-0 mt-2 rounded-md border border-neutral-200/90 bg-neutral-50 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900/55">
                <summary className={cn("cursor-pointer font-semibold text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  First session coaching
                </summary>
                <p className={cn("m-0 mt-1.5 leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {OPERATOR_CO_ARCHITECT_CHECKLIST_KICKER}
                </p>
                <ul className={cn("m-0 mt-1.5 list-disc space-y-1.5 pl-4 leading-snug text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
                  {CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS.map((line) => (
                    <li key={line} className="pl-0.5 marker:text-neutral-600 dark:marker:text-neutral-400">
                      {line}
                    </li>
                  ))}
                </ul>
              </details>
            </>
          ) : null}
        </div>
        <button
          type="button"
          onClick={panel.minimize}
          aria-expanded={true}
          aria-controls="first-run-workflow-panel"
          className={cn("auth-panel-focus shrink-0 cursor-pointer rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}
        >
          Hide
        </button>
      </div>
      {!panel.allDone ? (
        <div className="mt-2 flex items-center justify-between rounded-md border border-neutral-200/80 px-2.5 py-2 dark:border-neutral-800/80">
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} aria-live="polite">
            {panel.doneCount} of {panel.corePilotSteps.length} steps complete
          </p>
          <Link
            href="#core-pilot-checklist-anchor"
            className={cn("shrink-0", OPERATOR_LINK.optional)}
          >
            Continue checklist ↓
          </Link>
        </div>
      ) : (
        <p className={cn("m-0 mt-2 rounded-md border border-emerald-700/40 bg-al-surface-raised px-2 py-1.5 text-al-text-primary dark:border-emerald-800/50", OPERATOR_TYPOGRAPHY.helper)}>
          First review complete.
        </p>
      )}

    </section>
  );
}
