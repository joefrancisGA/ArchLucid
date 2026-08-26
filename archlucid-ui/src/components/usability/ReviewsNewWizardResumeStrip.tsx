"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { Button } from "@/components/ui/button";
import { REVIEWS_NEW_PRIMARY_CONTENT_ID } from "@/app/(operator)/architecture/reviews/new/reviews-new-page-surface-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  clearResumableReviewsNewWizardSession,
  dismissReviewsNewWizardResumeStrip,
  dispatchReviewsNewWizardContinueRequested,
  findVisibleReviewsNewPageLevelResumeSession,
  requestReviewsNewWizardAutoRestore,
  reviewsNewWizardPathIsActive,
  reviewsNewWizardResumeHref,
  type ReviewsNewResumableWizardSession,
} from "@/lib/reviews-new-wizard-session-resume";
import { cn } from "@/lib/utils";

function readVisibleResumableSession(): ReviewsNewResumableWizardSession | null {
  return findVisibleReviewsNewPageLevelResumeSession();
}

/** Dismissible resume strip for incomplete new-review wizard sessions on the RNX hub. */
export function ReviewsNewWizardResumeStrip(): React.JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<ReviewsNewResumableWizardSession | null>(null);

  useEffect(() => {
    setSession(readVisibleResumableSession());
  }, []);

  const refreshSession = useCallback(() => {
    setSession(readVisibleResumableSession());
  }, []);

  const onDismiss = useCallback(() => {
    if (session === null) {
      return;
    }

    dismissReviewsNewWizardResumeStrip(session);
    refreshSession();
  }, [refreshSession, session]);

  const onContinue = useCallback(() => {
    if (session === null) {
      return;
    }

    requestReviewsNewWizardAutoRestore(session.wizardId);
    dismissReviewsNewWizardResumeStrip(session);
    refreshSession();

    const pathQuery = searchParams?.get("path")?.trim() ?? "";
    const alreadyOnTargetPath = reviewsNewWizardPathIsActive(pathQuery, session.pathMode);

    if (alreadyOnTargetPath) {
      dispatchReviewsNewWizardContinueRequested(session.wizardId);
      document.getElementById(REVIEWS_NEW_PRIMARY_CONTENT_ID)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      return;
    }

    router.push(reviewsNewWizardResumeHref(session.pathMode));
  }, [refreshSession, router, searchParams, session]);

  const onStartOver = useCallback(() => {
    if (session === null) {
      return;
    }

    clearResumableReviewsNewWizardSession(session.wizardId);
    dismissReviewsNewWizardResumeStrip(session);
    refreshSession();
  }, [refreshSession, session]);

  if (session === null) {
    return null;
  }

  return (
    <section
      aria-labelledby="reviews-new-wizard-resume-heading"
      className="mb-4 rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/60"
      data-testid="reviews-new-wizard-resume-strip"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h2
            id="reviews-new-wizard-resume-heading"
            className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Resume your draft review
          </h2>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            This browser saved your in-progress review intake{" "}
            {formatRelativeTime(session.savedAtUtc)}. Continue to restore your steps, or start over.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="primary" onClick={onContinue}>
              Continue
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onStartOver}>
              Start over
            </Button>
          </div>
        </div>
        <DismissControl
          iconOnly
          ariaLabel="Dismiss resume draft review strip"
          data-testid="reviews-new-wizard-resume-dismiss"
          onDismiss={onDismiss}
        />
      </div>
    </section>
  );
}
