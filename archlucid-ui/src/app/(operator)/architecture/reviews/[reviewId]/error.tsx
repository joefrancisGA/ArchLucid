"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect } from "react";

import { OperatorErrorUiReferenceLine } from "@/components/operator/OperatorErrorUiReferenceLine";
import { OperatorErrorCallout } from "@/components/operator/OperatorShellMessage";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { CopyIdButton } from "@/components/CopyIdButton";
import { RunDetailMinimalChromeMount } from "@/components/runs/RunDetailMinimalChromeMount";
import { Button } from "@/components/ui/button";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { reportClientError } from "@/lib/error-telemetry";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

/**
 * Segment error boundary for `/architecture/reviews/[reviewId]` so review detail client failures show buyer-safe recovery
 * (not the parent `/runs` “reviews list” error segment).
 */
export default function RunDetailSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { source: "run-detail-segment-error-boundary", digest: error.digest ?? "" });
  }, [error]);

  const digest = error.digest?.trim() ?? "";
  const isDev = process.env.NODE_ENV === "development";
  const isStaticFallback = isStaticDemoPayloadFallbackEnabled();
  const isBuyerPolished = isBuyerPolishedOperatorShellEnv();

  if (isStaticFallback || isBuyerPolished) {
    return (
      <RunDetailMinimalChromeMount>
        <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <OperatorErrorCallout>
          <strong className={OPERATOR_TYPOGRAPHY.cardTitle}>Sample review unavailable</strong>
          <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {isBuyerPolished
              ? "Open the signed review record first, or use the read-only walkthrough below, to explore the Claims Intake outputs."
              : "Open the sample review or the public walkthrough below to explore the Claims Intake review outputs."}
          </p>
          {isDev ? (
            <pre
              className={cn(
                "mt-3 max-h-40 overflow-auto rounded border border-neutral-200 bg-neutral-50 p-2 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
                OPERATOR_TYPOGRAPHY.micro,
              )}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {error.message}
            </pre>
          ) : null}
        </OperatorErrorCallout>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="primary" asChild>
            <Link href={signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}>
              Open sample review
            </Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/showcase/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}>View sample review</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/architecture/reviews">Back to reviews</Link>
          </Button>
        </div>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          The sample above uses demo data. Your reviews remain available at{" "}
          <Link href="/architecture/reviews" className={OPERATOR_LINK.nav}>
            Reviews list
          </Link>
          .
        </p>
        <FatalPageReportProblemSupportRow
          surfaceId="review-detail-hard-load-failure"
          errorTitle="Sample review unavailable"
          errorCode="segment-error"
          {...(digest.length > 0 ? { correlationId: digest } : {})}
        />
        </div>
      </RunDetailMinimalChromeMount>
    );
  }

  return (
    <RunDetailMinimalChromeMount>
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <OperatorErrorCallout>
        <strong className={OPERATOR_TYPOGRAPHY.cardTitle}>Review could not be loaded</strong>
        <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {isDev
            ? "Development build — technical details appear below."
            : "This review could not render. Return to your reviews list or open Help."}
        </p>
        {isDev ? (
          <pre
            className={cn(
              "mt-3 max-h-40 overflow-auto rounded border border-neutral-200 bg-neutral-50 p-2 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
              OPERATOR_TYPOGRAPHY.micro,
            )}
            style={{ whiteSpace: "pre-wrap" }}
          >
            {error.message}
          </pre>
        ) : null}
        <OperatorErrorUiReferenceLine />
        {digest.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className={cn("m-0 flex min-w-0 flex-1 flex-wrap items-center gap-1", OPERATOR_TYPOGRAPHY.micro)}>
              <span className="shrink-0 font-semibold">Need support?</span>
              <span className="shrink-0">Provide error digest</span>
              <code className="break-all rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">{digest}</code>
              <span className="shrink-0">with steps to reproduce.</span>
            </p>
            <CopyIdButton value={digest} aria-label="Copy Next.js diagnostic digest" />
          </div>
        ) : null}
      </OperatorErrorCallout>
      {digest.length === 0 ? (
        <FatalPageReportProblemSupportRow
          surfaceId="review-detail-hard-load-failure"
          errorTitle="Review could not be loaded"
          errorCode="segment-error"
        />
      ) : (
        <FatalPageReportProblemSupportRow
          surfaceId="review-detail-hard-load-failure"
          errorTitle="Review could not be loaded"
          errorCode="segment-error"
          correlationId={digest}
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="primary" asChild>
          <Link href="/architecture/reviews">Back to reviews</Link>
        </Button>
        <Button type="button" variant="outline" onClick={() => reset()}>
          Retry
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/help">Help</Link>
        </Button>
      </div>
      </div>
    </RunDetailMinimalChromeMount>
  );
}
