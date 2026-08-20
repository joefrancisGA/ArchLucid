import type { FirstPilotOperatingRailSignals } from "@/lib/first-pilot-operating-rail-status";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL } from "@/lib/repeat-review-loop-help-title-honesty-surfaces";
import { secondReviewFromPriorHref } from "@/lib/second-review-prior-package";

export type RepeatReviewActivationAction = {
  label: string;
  href: string;
  reason: string;
};

export type RepeatReviewActivationPrompt = {
  headline: string;
  summary: string;
  primaryHref: string;
  primaryCta: string;
  actions: readonly RepeatReviewActivationAction[];
};

function reviewHref(runId: string | null | undefined): string | null {
  if (runId === null || runId === undefined || runId.trim().length === 0) {
    return null;
  }

  return `/architecture/reviews/${encodeURIComponent(runId.trim())}`;
}

/**
 * Non-blocking repeat-review activation copy after the first committed review (improvement #24).
 */
export function resolveRepeatReviewActivation(input: {
  committedReviewCount: number;
  latestRunId: string | null;
  firstCommittedRunId: string | null;
  secondCommittedRunId: string | null;
}): RepeatReviewActivationPrompt | null {
  const committedCount = input.committedReviewCount;

  if (committedCount <= 0) {
    return null;
  }

  const latestHref = reviewHref(input.latestRunId);
  const firstHref = reviewHref(input.firstCommittedRunId);
  const secondHref = reviewHref(input.secondCommittedRunId);

  if (committedCount === 1) {
    const priorRunId = (input.firstCommittedRunId ?? input.latestRunId ?? "").trim();

    return {
      headline: "Plan your second committed review",
      summary:
        "The first proof export is the baseline. A follow-up review shows progress when you compare against the prior manifest, replay authority for regressions, or tighten governance dry-runs before enforce.",
      primaryHref: priorRunId.length > 0 ? secondReviewFromPriorHref(priorRunId) : "/architecture/reviews/new",
      primaryCta: "Start next review",
      actions: [
        {
          label: "Open committed review",
          href: firstHref ?? latestHref ?? "/architecture/reviews",
          reason: "Reuse prior manifest context and unresolved findings from the first commit.",
        },
        {
          label: REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL,
          href: "/help/repeat-review-loop",
          reason: "Checklist for compare, replay, governance, and export-ready ROI labels.",
        },
      ],
    };
  }

  const compareHref =
    firstHref !== null && latestHref !== null && firstHref !== latestHref
      ? comparePageHrefAdaptive(input.firstCommittedRunId!, input.latestRunId)
      : secondHref !== null && latestHref !== null
        ? comparePageHrefAdaptive(input.secondCommittedRunId!, input.latestRunId)
        : "/insights/compare-two-reviews";

  return {
    headline: "Repeat reviews unlocked",
    summary:
      "You have multiple committed reviews. Compare against a prior review, replay authority, refresh the sponsor ROI rollup, and collect an updated proof packet for sponsors.",
    primaryHref: compareHref,
    primaryCta: "Compare two reviews",
    actions: [
      {
        label: "Replay latest review",
        href:
          latestHref !== null
            ? `/internal/validate-route?runId=${encodeURIComponent(input.latestRunId!)}`
            : "/internal/validate-route",
        reason: "Reconstruct authority pipeline when investigating regressions.",
      },
      {
        label: "Sponsor value report",
        href: "/insights/sponsor-report",
        reason: "Sponsor-safe ROI rollup with source labels and freshness disposition.",
      },
      {
        label: REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL,
        href: "/help/repeat-review-loop",
        reason: "Second-review proof checklist and follow-up review signals.",
      },
    ],
  };
}

/** Convenience wrapper when only operating-rail signals are available. */
export function resolveRepeatReviewActivationFromSignals(input: {
  signals: FirstPilotOperatingRailSignals;
  committedReviewCount: number;
  secondCommittedRunId: string | null;
}): RepeatReviewActivationPrompt | null {
  if (!input.signals.hasCommittedManifest) {
    return null;
  }

  return resolveRepeatReviewActivation({
    committedReviewCount: input.committedReviewCount,
    latestRunId: input.signals.latestRunId,
    firstCommittedRunId: input.signals.firstCommittedRunId,
    secondCommittedRunId: input.secondCommittedRunId,
  });
}
