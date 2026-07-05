"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";
import {
  CORE_PILOT_CHECKLIST_CHANGED_EVENT,
  CORE_PILOT_STEP_COUNT,
  PILOT_CHECKLIST_PANEL_STORAGE_KEY,
  readPilotChecklistPanelState,
  writePilotChecklistPanelState,
} from "@/lib/core-pilot-checklist-storage";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { resolveCorePilotStepPresentation } from "@/lib/core-pilot-step-presentation";
import { useCorePilotCommitPresentationContext } from "@/lib/use-core-pilot-commit-presentation-context";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator-home-disclosure-storage";
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

/** Operator-home checklist: manual "mark complete" synced with `archlucid-pilot-checklist` and legacy step keys. */
export function CorePilotChecklist(props: CorePilotChecklistProps = {}) {
  const checklistVariant = props.variant ?? "full";
  const commitPresentationContext = useCorePilotCommitPresentationContext();
  const [hydrated, setHydrated] = useState(false);
  const [stepsDone, setStepsDone] = useState<boolean[]>(() =>
    Array.from({ length: CORE_PILOT_STEP_COUNT }, () => false),
  );
  const [defaultExpanded, setDefaultExpanded] = useState(false);

  const persist = useCallback((nextSteps: boolean[]) => {
    writePilotChecklistPanelState({ steps: nextSteps, hidden: false });
  }, []);

  useEffect(() => {
    const s = readPilotChecklistPanelState();

    setStepsDone(s.steps);
    setDefaultExpanded(!s.hidden);
    setHydrated(true);

    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(PILOT_CHECKLIST_PANEL_STORAGE_KEY) === null) {
        writePilotChecklistPanelState(s);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    function syncFromStorage() {
      const s = readPilotChecklistPanelState();

      setStepsDone(s.steps);
    }

    window.addEventListener(CORE_PILOT_CHECKLIST_CHANGED_EVENT, syncFromStorage);

    return () => {
      window.removeEventListener(CORE_PILOT_CHECKLIST_CHANGED_EVENT, syncFromStorage);
    };
  }, [hydrated]);

  if (!hydrated) {
    return null;
  }

  const allDone = stepsDone.every(Boolean);
  const compact = checklistVariant === "compact";

  if (compact) {
    return (
      <OperatorHomeDisclosureSection
        title="Review walkthrough"
        titleId="core-pilot-checklist-heading"
        sectionTestId="core-pilot-checklist"
        storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.reviewWorkflowChecklist}
        defaultExpanded={false}
        collapsedSummary={`${CORE_PILOT_STEP_COUNT} steps to your first architecture review package.`}
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
      collapsedSummary={`${CORE_PILOT_STEP_COUNT} manual steps from empty tenant to first architecture review package.`}
    >
      <OperatorHomeGuidanceLink helpSlug="core-pilot" label="Open Core Pilot guide" className="mb-3 inline-block" />

      <p className={cn("m-0 mb-3", OPERATOR_TYPOGRAPHY.body, "text-neutral-600 dark:text-neutral-400")}>
        Work through the {CORE_PILOT_STEP_COUNT} steps from an empty tenant to your first architecture review package
        — check each when you have done it.
      </p>

      <ol className="m-0 list-none space-y-4 p-0">
        {CORE_PILOT_STEPS.map((step, index) => {
          const checkboxId = `core-pilot-checklist-step-${index}`;
          const hashFragment = CORE_PILOT_HELP_HASH_FRAGMENTS[index];
          const stepPresentation = resolveCorePilotStepPresentation(index, commitPresentationContext);

          return (
            <li
              key={step.title}
              className="border-b border-neutral-100 pb-4 last:border-b-0 last:pb-0 dark:border-neutral-800"
            >
              <div className="flex flex-wrap items-start gap-2">
                <Link
                  href={stepPresentation.href}
                  className={cn(OPERATOR_TYPOGRAPHY.body, OPERATOR_LINK.step, "font-semibold")}
                >
                  {step.title}
                </Link>
                <OperatorHomeGuidanceLink
                  helpSlug="core-pilot"
                  hashFragment={hashFragment}
                  label={`Core Pilot guide, step ${index + 1}`}
                />
              </div>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body, "text-neutral-700 dark:text-neutral-300")}>{step.shortBody}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={stepsDone[index] === true}
                  className="h-4 w-4 shrink-0 rounded border-neutral-400 text-teal-600 focus:ring-teal-500 dark:border-neutral-500"
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const nextSteps = stepsDone.map((v, i) => (i === index ? checked : v));

                    setStepsDone(nextSteps);
                    persist(nextSteps);
                  }}
                />
                <label htmlFor={checkboxId} className={cn("text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
                  Mark complete
                </label>
                <button
                  type="button"
                  className={cn("font-medium text-neutral-600 underline dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                  onClick={() => {
                    const nextSteps = stepsDone.map((v, i) => (i === index ? false : v));

                    setStepsDone(nextSteps);
                    persist(nextSteps);
                  }}
                >
                  Skip for now
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {allDone ? (
        <div
          className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/50"
          data-testid="core-pilot-checklist-complete"
        >
          <p className={cn("m-0 font-medium text-teal-950 dark:text-teal-100", OPERATOR_TYPOGRAPHY.body)}>
            You have stepped through the Core Pilot path — open a finalized architecture review to explore the full review package.
          </p>
        </div>
      ) : null}
    </OperatorHomeDisclosureSection>
  );
}
