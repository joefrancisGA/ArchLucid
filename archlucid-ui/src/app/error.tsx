"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect } from "react";

import { OperatorErrorUiReferenceLine } from "@/components/operator/OperatorErrorUiReferenceLine";
import { OperatorErrorCallout } from "@/components/operator/OperatorShellMessage";
import { CopyIdButton } from "@/components/CopyIdButton";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { reportClientError } from "@/lib/error-telemetry";

/**
 * Catches errors in route segments below the root layout (pages, nested layouts).
 * Does not catch errors in root layout.tsx — see global-error.tsx.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Operator shell route error:", error);
    reportClientError(error, { source: "app-error-boundary", digest: error.digest ?? "" });
  }, [error]);

  const digest = error.digest?.trim() ?? "";
  const isDev = process.env.NODE_ENV === "development";

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <OperatorErrorCallout>
        <strong className={OPERATOR_TYPOGRAPHY.cardTitle}>Something went wrong</strong>
        <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {isDev
            ? "Development build — technical details appear below."
            : "This page hit an unexpected error. You can try again or open Help for guidance."}
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
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="primary" onClick={() => reset()}>
          Retry
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/help">Help</Link>
        </Button>
      </div>
    </main>
  );
}
