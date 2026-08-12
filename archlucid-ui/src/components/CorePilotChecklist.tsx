"use client";

import { cn } from "@/lib/utils";

import Link from "next/link";

import { useEffect, useState } from "react";

import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";

import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";

import { StatusTag } from "@/components/ui/status-tag";

import {

  PILOT_CHECKLIST_PANEL_STORAGE_KEY,

  readPilotChecklistPanelState,

  writeCorePilotOptionalStepSkipped,

  writePilotChecklistPanelState,

} from "@/lib/core-pilot-checklist-storage";

import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";

import { isCorePilotStepOptional, corePilotStepStatusTag } from "@/lib/core-pilot-step-status";

import { resolveCorePilotStepPresentation } from "@/lib/core-pilot-step-presentation";

import { useCorePilotCommitPresentationContext } from "@/lib/use-core-pilot-commit-presentation-context";

import { useCorePilotDerivedStepStatus } from "@/lib/use-core-pilot-derived-step-status";

import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator/operator-home-disclosure-storage";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Anchor ids in docs/CORE_PILOT.md walkthrough (section 3) — keep aligned with headings. */

const CORE_PILOT_HELP_HASH_FRAGMENTS = [

  "first-session-checklist",

  "new-run",

  "pipeline-status",

  "commit",

  "manifest-review",

] as const;

type CorePilotChecklistProps = {

  /** Home page: titles only; full descriptions live in the Core Pilot guide. */

  readonly variant?: "full" | "compact";

};

/** First-review checklist — step completion is derived from tenant/review lifecycle signals. */

export function CorePilotChecklist(props: CorePilotChecklistProps = {}) {

  const checklistVariant = props.variant ?? "full";

  const commitPresentationContext = useCorePilotCommitPresentationContext();

  const { statuses, progress, nextStepIndex } = useCorePilotDerivedStepStatus();

  const [hydrated, setHydrated] = useState(false);

  const [defaultExpanded, setDefaultExpanded] = useState(false);

  useEffect(() => {
    const panelState = readPilotChecklistPanelState();

    setDefaultExpanded(!panelState.hidden);

    setHydrated(true);

    try {

      if (typeof window !== "undefined" && window.localStorage.getItem(PILOT_CHECKLIST_PANEL_STORAGE_KEY) === null) {

        writePilotChecklistPanelState(panelState);

      }

    } catch {

      /* ignore */

    }

  }, []);

  if (!hydrated) {

    return null;

  }

  const compact = checklistVariant === "compact";

  const requiredComplete = progress.allDone;

  const highlightedNextIndex = nextStepIndex;

  if (compact) {

    return (

      <OperatorHomeDisclosureSection

        title="Review walkthrough"

        titleId="core-pilot-checklist-heading"

        sectionTestId="core-pilot-checklist"

        storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.reviewWorkflowChecklist}

        defaultExpanded={false}

        collapsedSummary={`${CORE_PILOT_STEPS.length} steps to your first architecture review.`}

      >

        <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body, "text-neutral-700 dark:text-neutral-300")}>

          {CORE_PILOT_STEPS.map((step) => (

            <li key={step.title}>{step.title}</li>

          ))}

        </ul>

        <OperatorHomeGuidanceLink helpSlug="core-pilot" label="Open checklist" className="mt-3 inline-block" />

      </OperatorHomeDisclosureSection>

    );

  }

  return (

    <OperatorHomeDisclosureSection

      title="Review walkthrough"

      titleId="core-pilot-checklist-heading"

      sectionTestId="core-pilot-checklist"

      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.reviewWorkflowChecklist}

      defaultExpanded={defaultExpanded}

      collapsedSummary={`${CORE_PILOT_STEPS.length} steps from empty tenant to first architecture review.`}
    >

      <OperatorHomeGuidanceLink helpSlug="core-pilot" label="Open Core Pilot guide" className="mb-3 inline-block" />

      <p className={cn("m-0 mb-3", OPERATOR_TYPOGRAPHY.body, "text-neutral-600 dark:text-neutral-400")}>

        Progress updates automatically from your workspace reviews. Optional enrichment steps can be skipped.

      </p>

      <ol className="m-0 list-none space-y-4 p-0">

        {CORE_PILOT_STEPS.map((step, index) => {

          const hashFragment = CORE_PILOT_HELP_HASH_FRAGMENTS[index];

          const stepStatus = statuses[index] ?? "not-started";

          const statusTag = corePilotStepStatusTag(stepStatus);

          const stepPresentation = resolveCorePilotStepPresentation(index, commitPresentationContext);

          const isHighlightedNext = highlightedNextIndex === index;

          return (

            <li

              key={step.title}

              className={cn(

                "border-b border-neutral-100 pb-4 last:border-b-0 last:pb-0 dark:border-neutral-800",

                isHighlightedNext ? "rounded-md border-l-4 border-l-teal-600 bg-teal-50/40 pl-3 dark:border-l-teal-400 dark:bg-teal-950/20" : null,

              )}

              data-testid={isHighlightedNext ? "core-pilot-checklist-next-step" : undefined}

            >

              <div className="flex flex-wrap items-start gap-2">

                <Link

                  href={stepPresentation.href}

                  className={cn(OPERATOR_TYPOGRAPHY.body, OPERATOR_LINK.step, "font-semibold")}

                >

                  {step.title}

                </Link>

                <StatusTag kind={statusTag.kind} label={statusTag.label} />

                <OperatorHomeGuidanceLink

                  helpSlug="core-pilot"

                  hashFragment={hashFragment}

                  label={`Core Pilot guide, step ${index + 1}`}

                />

              </div>

              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body, "text-neutral-700 dark:text-neutral-300")}>{step.shortBody}</p>

              {isHighlightedNext ? (

                <p className={cn("m-0 mt-2 font-medium text-teal-900 dark:text-teal-100", OPERATOR_TYPOGRAPHY.helper)}>

                  Next: {stepPresentation.label}

                </p>

              ) : null}

              {isCorePilotStepOptional(index) && stepStatus !== "done" && stepStatus !== "skipped" ? (

                <div className="mt-2">

                  <button

                    type="button"

                    className={cn("font-medium text-neutral-600 underline dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}

                    onClick={() => {

                      writeCorePilotOptionalStepSkipped(index, true);

                    }}

                  >

                    Skip for now

                  </button>

                </div>

              ) : null}

            </li>

          );

        })}

      </ol>

      {requiredComplete ? (

        <div

          className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/50"

          data-testid="core-pilot-checklist-complete"

        >

          <p className={cn("m-0 font-medium text-teal-950 dark:text-teal-100", OPERATOR_TYPOGRAPHY.body)}>

            Required first-review steps are complete — open your finalized architecture review to explore the full review.

          </p>

        </div>

      ) : null}

    </OperatorHomeDisclosureSection>

  );

}

