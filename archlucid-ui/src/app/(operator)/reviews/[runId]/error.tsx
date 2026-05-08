"use client";

import Link from "next/link";
import { useEffect } from "react";

import { OperatorErrorUiReferenceLine } from "@/components/OperatorErrorUiReferenceLine";
import { OperatorErrorCallout } from "@/components/OperatorShellMessage";
import { CopyIdButton } from "@/components/CopyIdButton";
import { RunDetailMinimalChromeMount } from "@/components/RunDetailMinimalChromeMount";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/error-telemetry";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID } from "@/lib/showcase-static-demo";

/**
 * Segment error boundary for `/reviews/[runId]` so review detail client failures show buyer-safe recovery
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
        <main className="mx-auto max-w-lg space-y-4 px-4 py-8">
        <OperatorErrorCallout>
          <strong className="text-base">Sample review unavailable</strong>
          <p className="mt-2 text-sm">
            {isBuyerPolished
              ? "Open the sample review package or the guided preview below to explore the Claims Intake outputs."
              : "Open the sample manifest or the public walkthrough below to explore the Claims Intake review outputs."}
          </p>
          {isDev ? (
            <pre
              className="mt-3 max-h-40 overflow-auto rounded border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {error.message}
            </pre>
          ) : null}
        </OperatorErrorCallout>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="primary" asChild>
            <Link href={`/manifests/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`}>
              {isBuyerPolished ? "Open sample review package" : "Open sample manifest"}
            </Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/demo/preview">{isBuyerPolished ? "Read-only walkthrough" : "View sample walkthrough"}</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/reviews?projectId=default">Back to reviews</Link>
          </Button>
        </div>
        </main>
      </RunDetailMinimalChromeMount>
    );
  }

  return (
    <RunDetailMinimalChromeMount>
      <main className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <OperatorErrorCallout>
        <strong className="text-base">Review could not be loaded</strong>
        <p className="mt-2 text-sm">
          {isDev
            ? "Development build — technical details appear below."
            : "This review could not render. Return to your reviews list or open Help."}
        </p>
        {isDev ? (
          <pre
            className="mt-3 max-h-40 overflow-auto rounded border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            style={{ whiteSpace: "pre-wrap" }}
          >
            {error.message}
          </pre>
        ) : null}
        <OperatorErrorUiReferenceLine />
        {digest.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="m-0 flex min-w-0 flex-1 flex-wrap items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-400">
              <span className="shrink-0 font-semibold">Need support?</span>
              <span className="shrink-0">Provide error digest</span>
              <code className="break-all rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">{digest}</code>
              <span className="shrink-0">with steps to reproduce.</span>
            </p>
            <CopyIdButton value={digest} aria-label="Copy Next.js diagnostic digest" />
          </div>
        ) : null}
      </OperatorErrorCallout>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="primary" asChild>
          <Link href="/reviews?projectId=default">Back to reviews</Link>
        </Button>
        <Button type="button" variant="outline" onClick={() => reset()}>
          Retry
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/">Home</Link>
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/help">Help</Link>
        </Button>
      </div>
      </main>
    </RunDetailMinimalChromeMount>
  );
}
