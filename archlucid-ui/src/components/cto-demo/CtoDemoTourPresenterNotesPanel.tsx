"use client";

import Link from "next/link";

import { CtoDemoStorySelector } from "@/components/cto-demo/CtoDemoStorySelector";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { CTO_DEMO_QUESTIONS } from "@/lib/buyer/buyer-cto-demo-cto-questions";
import { buildCtoDemoProofHref } from "@/lib/buyer/buyer-cto-demo-proof-href";
import type { CtoDemoSmokeCheckResult } from "@/lib/buyer/buyer-cto-demo-smoke-check";
import type { resolveBuyerCtoDemoTourNavigation } from "@/lib/buyer/buyer-cto-demo-tour";
import {
  formatCtoDemoStepBudgetLabel,
  writeBuyerCtoDemoAutoplay,
  writeBuyerCtoDemoPresenterNotesFullScript,
  writeBuyerCtoDemoPresenterNotesVisible,
} from "@/lib/buyer/buyer-cto-demo-tour";
import { BUYER_CTO_DEMO_COMPARE_HREF } from "@/lib/buyer/buyer-golden-journey-nav";
import {
  BUYER_CTO_DEMO_COMPARE_DRIFT_CTA,
  BUYER_CTO_DEMO_COMPARE_DRIFT_LABEL,
  BUYER_CTO_DEMO_PANIC_ENABLE_CTA,
  BUYER_CTO_DEMO_PANIC_ENABLED_LABEL,
  BUYER_CTO_DEMO_PANIC_SCRIPT_BODY,
  BUYER_CTO_DEMO_PANIC_SCRIPT_HEADING,
  BUYER_CTO_DEMO_QUESTIONS_HIDE_CTA,
  BUYER_CTO_DEMO_QUESTIONS_SHOW_CTA,
  BUYER_CTO_DEMO_SMOKE_CHECK_CTA,
  BUYER_CTO_DEMO_SMOKE_CHECK_RECHECK_CTA,
  BUYER_CTO_DEMO_TOUR_AUTOPLAY_OFF_CTA,
  BUYER_CTO_DEMO_TOUR_AUTOPLAY_ON_CTA,
  BUYER_CTO_DEMO_TOUR_KEYBOARD_HINT,
  BUYER_CTO_DEMO_TOUR_NOTES_FULL_CTA,
  BUYER_CTO_DEMO_TOUR_NOTES_HIDE_CTA,
  BUYER_CTO_DEMO_TOUR_NOTES_SHOW_CTA,
  BUYER_CTO_DEMO_TOUR_NOTES_SUMMARY_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { DESIGN_TOKENS, OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPE_SCALE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, writeOperatorDemoPanicOffline } from "@/lib/operator/operator-static-demo";
import { cn } from "@/lib/utils";

type TourNavigation = ReturnType<typeof resolveBuyerCtoDemoTourNavigation>;

type StepTimer = {
  display: string;
  isOvertime: boolean;
};

type SelectedStory = {
  label: string;
  policyPackLabel: string;
};

export type CtoDemoTourPresenterNotesPanelProps = {
  showPresenterLayer: boolean;
  navigation: TourNavigation;
  stepTimer: StepTimer | null;
  presenterNotesText: string;
  presenterNotesVisible: boolean;
  presenterNotesFullScript: boolean;
  ctoQuestionsVisible: boolean;
  autoplay: boolean;
  panicEnabled: boolean;
  storyId: string;
  selectedStory: SelectedStory;
  smokeBusy: boolean;
  smokeResults: readonly CtoDemoSmokeCheckResult[] | null;
  onPresenterNotesVisibleChange: (visible: boolean) => void;
  onPresenterNotesFullScriptChange: (fullScript: boolean) => void;
  onCtoQuestionsVisibleChange: (visible: boolean) => void;
  onAutoplayChange: (autoplay: boolean) => void;
  onPanicEnabledChange: (enabled: boolean) => void;
  onStoryIdChange: (storyId: string) => void;
  onRunSmokeCheck: () => void;
};

export function CtoDemoTourPresenterNotesPanel({
  showPresenterLayer,
  navigation,
  stepTimer,
  presenterNotesText,
  presenterNotesVisible,
  presenterNotesFullScript,
  ctoQuestionsVisible,
  autoplay,
  panicEnabled,
  storyId,
  selectedStory,
  smokeBusy,
  smokeResults,
  onPresenterNotesVisibleChange,
  onPresenterNotesFullScriptChange,
  onCtoQuestionsVisibleChange,
  onAutoplayChange,
  onPanicEnabledChange,
  onStoryIdChange,
  onRunSmokeCheck,
}: CtoDemoTourPresenterNotesPanelProps): React.JSX.Element | null {
  if (!showPresenterLayer) {
    return null;
  }

  return (
    <>
      {navigation.stepIndex !== null && stepTimer !== null ? (
        <div className="mt-2" data-testid="buyer-cto-demo-tour-step-budget">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.badge, "text-neutral-500 dark:text-neutral-400")}>
            {formatCtoDemoStepBudgetLabel(navigation.stepIndex)}
          </p>
          <p
            className={cn(
              "m-0 mt-0.5 tabular-nums",
              OPERATOR_TYPOGRAPHY.badge,
              stepTimer.isOvertime
                ? "font-medium text-amber-700 dark:text-amber-300"
                : "text-neutral-500 dark:text-neutral-400",
            )}
            data-testid="buyer-cto-demo-tour-step-timer"
          >
            {stepTimer.display}
          </p>
        </div>
      ) : null}

      {presenterNotesVisible ? (
        <p className={cn("m-0 mt-2", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
          {presenterNotesText}
        </p>
      ) : null}

      {presenterNotesVisible && navigation.stepIndex === 2 ? (
        <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} data-testid="cto-demo-compare-drift-beat">
          {BUYER_CTO_DEMO_COMPARE_DRIFT_LABEL}:{" "}
          <Link
            href={BUYER_CTO_DEMO_COMPARE_HREF}
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            data-testid="cto-demo-compare-drift-link"
          >
            {BUYER_CTO_DEMO_COMPARE_DRIFT_CTA}
          </Link>
        </p>
      ) : null}

      {presenterNotesVisible ? (
        <div className={cn("mt-2", DESIGN_TOKENS.callout.warn)} data-testid="cto-demo-panic-script-section">
          <p className={cn("m-0 font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
            Presenter only
          </p>
          <p className={cn("m-0 mt-2 font-semibold text-amber-900 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
            {BUYER_CTO_DEMO_PANIC_SCRIPT_HEADING}
          </p>
          <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            {BUYER_CTO_DEMO_PANIC_SCRIPT_BODY}
          </p>
          <div className="mt-2">
            {panicEnabled ? (
              <StatusTag kind="ready" label={BUYER_CTO_DEMO_PANIC_ENABLED_LABEL} />
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                data-testid="cto-demo-panic-enable-btn"
                onClick={() => {
                  writeOperatorDemoPanicOffline(true);
                  window.dispatchEvent(new CustomEvent(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, { detail: { on: true } }));
                  onPanicEnabledChange(true);
                }}
              >
                {BUYER_CTO_DEMO_PANIC_ENABLE_CTA}
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {navigation.stepIndex === 0 ? (
        <>
          <CtoDemoStorySelector
            selectedStoryId={storyId}
            onStoryChange={(story) => {
              onStoryIdChange(story.id);
            }}
          />

          {storyId !== "healthcare" ? (
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.badge, "text-neutral-600 dark:text-neutral-400")}>
              Story: {selectedStory.label} · {selectedStory.policyPackLabel}
            </p>
          ) : null}

          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={smokeBusy}
              data-testid="cto-demo-smoke-check-trigger"
              onClick={onRunSmokeCheck}
            >
              {smokeBusy
                ? "Checking…"
                : smokeResults === null
                  ? BUYER_CTO_DEMO_SMOKE_CHECK_CTA
                  : BUYER_CTO_DEMO_SMOKE_CHECK_RECHECK_CTA}
            </Button>

            {smokeResults !== null ? (
              <ul className={cn("m-0 mt-2 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="cto-demo-smoke-check-results">
                {smokeResults.map((row) => (
                  <li key={row.stepLabel} className="flex items-center gap-1.5">
                    <span
                      className={cn("inline-block h-2 w-2 rounded-full", row.ok ? "bg-teal-600" : "bg-red-600")}
                      aria-hidden
                    />
                    <span>
                      {row.stepLabel}
                      {!row.ok && row.statusCode !== null ? ` (${row.statusCode})` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </>
      ) : null}

      <p className={cn("m-0 mt-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {BUYER_CTO_DEMO_TOUR_KEYBOARD_HINT}
      </p>

      <div className="mt-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2 text-neutral-600 dark:text-neutral-400"
          data-testid="buyer-cto-demo-tour-notes-toggle"
          onClick={() => {
            const next = !presenterNotesVisible;
            onPresenterNotesVisibleChange(next);
            writeBuyerCtoDemoPresenterNotesVisible(next);
          }}
        >
          {presenterNotesVisible ? BUYER_CTO_DEMO_TOUR_NOTES_HIDE_CTA : BUYER_CTO_DEMO_TOUR_NOTES_SHOW_CTA}
        </Button>

        {presenterNotesVisible ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2 text-neutral-600 dark:text-neutral-400"
            data-testid="buyer-cto-demo-tour-notes-mode-toggle"
            onClick={() => {
              const next = !presenterNotesFullScript;
              onPresenterNotesFullScriptChange(next);
              writeBuyerCtoDemoPresenterNotesFullScript(next);
            }}
          >
            {presenterNotesFullScript ? BUYER_CTO_DEMO_TOUR_NOTES_SUMMARY_CTA : BUYER_CTO_DEMO_TOUR_NOTES_FULL_CTA}
          </Button>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2 text-neutral-600 dark:text-neutral-400"
          data-testid="buyer-cto-demo-tour-cto-questions-toggle"
          onClick={() => {
            onCtoQuestionsVisibleChange(!ctoQuestionsVisible);
          }}
        >
          {ctoQuestionsVisible ? BUYER_CTO_DEMO_QUESTIONS_HIDE_CTA : BUYER_CTO_DEMO_QUESTIONS_SHOW_CTA}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2 text-neutral-600 dark:text-neutral-400"
          data-testid="cto-demo-autoplay-toggle"
          onClick={() => {
            const next = !autoplay;
            onAutoplayChange(next);
            writeBuyerCtoDemoAutoplay(next);
          }}
        >
          {autoplay ? BUYER_CTO_DEMO_TOUR_AUTOPLAY_OFF_CTA : BUYER_CTO_DEMO_TOUR_AUTOPLAY_ON_CTA}
        </Button>
      </div>

      {ctoQuestionsVisible ? (
        <ol
          className={cn("m-0 mt-2 list-decimal space-y-2 pl-4 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="buyer-cto-demo-tour-cto-questions"
        >
          {CTO_DEMO_QUESTIONS.map((row) => (
            <li key={row.id}>
              <p className="m-0 font-semibold text-neutral-900 dark:text-neutral-100">{row.question}</p>
              <p className="m-0 mt-0.5 text-neutral-600 dark:text-neutral-400">{row.answer}</p>
              <Link href={buildCtoDemoProofHref(row)} className={cn("mt-0.5 inline-block", OPERATOR_BODY_INLINE_LINK_CLASS)}>
                {row.proofLabel}
              </Link>
            </li>
          ))}
        </ol>
      ) : null}
    </>
  );
}
