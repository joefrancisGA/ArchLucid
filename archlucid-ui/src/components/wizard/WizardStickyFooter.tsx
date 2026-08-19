"use client";

import type { ReactNode } from "react";

import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import {
  WizardCreationProgressNotices,
  type WizardCreationProgressState,
} from "@/components/wizard/WizardCreationProgressNotices";
import { WizardSubmitProblem } from "@/components/wizard/WizardSubmitProblem";
import { OPERATOR_SHELL_CONTENT_BLEED_X_CLASS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const STICKY_FOOTER_CLASS =
  "sticky bottom-0 z-10 mt-8 border-t border-neutral-200/60 bg-neutral-50/98 py-3 shadow-[0_-2px_8px_-2px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-neutral-50/85 dark:border-neutral-800/60 dark:bg-neutral-950/98 dark:shadow-[0_-2px_8px_-2px_rgba(0,0,0,0.25)] dark:supports-[backdrop-filter]:bg-neutral-950/85";

export type WizardStickyFooterProps = {
  /** Test-id stem, e.g. `quick-start` → `quick-start-footer`. */
  readonly testIdPrefix: string;
  readonly progress: WizardCreationProgressState;
  readonly onRecheck: () => void;
  /** Client-side step/submit validation copy; rendered on every step. */
  readonly stepValidationMessage?: string | null;
  /** Server-side submit failure; rendered only when {@link showSubmitError} is true. */
  readonly submitError?: unknown;
  readonly showSubmitError?: boolean;
  /** Navigation row — usually `WizardNavButtons`, whose labels differ per wizard. */
  readonly children: ReactNode;
};

/**
 * Shared sticky action bar for the WizardFormValues wizard family: create-run progress, recovery
 * notices, validation and submit errors, then the caller's navigation row.
 */
export function WizardStickyFooter(props: WizardStickyFooterProps): React.ReactElement {
  const {
    testIdPrefix,
    progress,
    onRecheck,
    stepValidationMessage = null,
    submitError = null,
    showSubmitError = false,
    children,
  } = props;

  return (
    <div
      className={cn(STICKY_FOOTER_CLASS, OPERATOR_SHELL_CONTENT_BLEED_X_CLASS)}
      data-testid={`${testIdPrefix}-footer`}
    >
      <WizardCreationProgressNotices
        progress={progress}
        testIdPrefix={testIdPrefix}
        onRecheck={onRecheck}
      />

      {stepValidationMessage !== null ? (
        <div className="mb-3" data-testid={`${testIdPrefix}-validation-error`}>
          <ReviewStartInlineError message={stepValidationMessage} />
        </div>
      ) : null}

      {showSubmitError && submitError !== null ? (
        <div className="mb-3" data-testid={`${testIdPrefix}-submit-error`}>
          <WizardSubmitProblem error={submitError} />
        </div>
      ) : null}

      {children}
    </div>
  );
}
