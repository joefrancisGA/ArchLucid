"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { InlineGuidance } from "@/components/InlineGuidance";
import type { RunDetailFirstScreenProofSummary } from "@/lib/runs/run-detail-first-screen-proof-status";
import { runDetailFirstScreenProofDispositionClass } from "@/lib/runs/run-detail-first-screen-proof-status";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import { REVIEW_DETAIL_URL_CHANGED_EVENT } from "@/lib/review-detail-workspace-tabs";
import {
  parseRunDetailFirstScreenProofOpenFromSearch,
  runDetailFirstScreenProofDisclosureHrefFromSearch,
} from "@/lib/runs/run-detail-first-screen-proof-disclosure-url";
import { PROOF_CONFIDENCE_FIELD_LABEL } from "@/lib/proof-confidence-taxonomy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type RunDetailFirstScreenProofStatusProps = {
  readonly summary: RunDetailFirstScreenProofSummary;
};

/** First-screen READY/WARN/HOLD proof summary for run detail (Improvement #24). */
export function RunDetailFirstScreenProofStatus(props: RunDetailFirstScreenProofStatusProps): React.JSX.Element {
  const { summary } = props;
  const pathname = usePathname() ?? "/";
  const [proofDetailsOpen, setProofDetailsOpenState] = useState(() =>
    parseRunDetailFirstScreenProofOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("runDetailFirstScreenProofOpen"),
    ),
  );
  const primaryBullet = summary.whySafeToSendBullets[0] ?? null;
  const detailBullets = summary.whySafeToSendBullets.slice(1);

  const syncProofDetailsOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        runDetailFirstScreenProofDisclosureHrefFromSearch(window.location.search.slice(1), open, pathname),
        { notify: true },
      );
    },
    [pathname],
  );

  const setProofDetailsOpen = useCallback(
    (open: boolean) => {
      if (proofDetailsOpen === open) {
        return;
      }

      setProofDetailsOpenState(open);
      syncProofDetailsOpenToUrl(open);
    },
    [proofDetailsOpen, syncProofDetailsOpenToUrl],
  );

  useEffect(() => {
    const syncProofDetailsOpenFromUrl = (): void => {
      setProofDetailsOpenState(
        parseRunDetailFirstScreenProofOpenFromSearch(
          new URLSearchParams(window.location.search).get("runDetailFirstScreenProofOpen"),
        ),
      );
    };

    syncProofDetailsOpenFromUrl();
    window.addEventListener("popstate", syncProofDetailsOpenFromUrl);
    window.addEventListener(REVIEW_DETAIL_URL_CHANGED_EVENT, syncProofDetailsOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncProofDetailsOpenFromUrl);
      window.removeEventListener(REVIEW_DETAIL_URL_CHANGED_EVENT, syncProofDetailsOpenFromUrl);
    };
  }, []);

  return (
    <section
      className={`min-w-0 overflow-visible rounded-lg border px-4 py-3 ${runDetailFirstScreenProofDispositionClass(summary.disposition)}`}
      data-testid="run-detail-first-screen-proof-status"
      aria-label={summary.cardTitle}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("font-semibold", OPERATOR_TYPOGRAPHY.cardTitle)}>{summary.cardTitle}</span>
        <span className={cn("rounded-full border border-current/25 px-2 py-0.5 font-semibold uppercase tracking-wide", OPERATOR_TYPOGRAPHY.badge)}>
          {summary.disposition}
        </span>
      </div>

      {primaryBullet !== null ? (
        <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.body)}>{primaryBullet}</p>
      ) : null}

      <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.body)}>
        <InlineGuidance label="Next action:" labelTestId="inline-guidance-next-action">
          {summary.nextAction}
        </InlineGuidance>
      </p>

      <details
        className="mt-3"
        open={proofDetailsOpen}
        onToggle={(event) => {
          setProofDetailsOpen(event.currentTarget.open);
        }}
      >
        <summary className={cn("cursor-pointer font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
          View proof details
        </summary>
        <div className="mt-3 min-w-0 space-y-3">
          {detailBullets.length > 0 ? (
            <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
              {detailBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}

          <dl className={cn("m-0 grid min-w-0 gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className="font-semibold">{PROOF_CONFIDENCE_FIELD_LABEL}</dt>
              <dd className="m-0">{summary.proofConfidenceLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold">Execution mode</dt>
              <dd className="m-0">{summary.executionModeLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold">Sponsor proof gate</dt>
              <dd className="m-0">{summary.pilotStrictLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold">ROI source basis</dt>
              <dd className="m-0">{summary.roiBasisLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold">Proof disposition</dt>
              <dd className="m-0">{summary.proofPacketLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold">Governed coverage</dt>
              <dd className="m-0">{summary.governedCoverageLabel}</dd>
            </div>
          </dl>

          {summary.detail ? (
            <p className={cn("m-0 opacity-90", OPERATOR_TYPOGRAPHY.helper)}>{summary.detail}</p>
          ) : null}
        </div>
      </details>
    </section>
  );
}
