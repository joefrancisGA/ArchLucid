import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Suspense fallback shown while the Compare form client component is initializing (reading URL params). */
export function CompareSuspenseFallback() {
  const buyerPolished = isBuyerPolishedOperatorShellEnv();

  return (
    <div>
      <OperatorLoadingNotice>
        <strong>Loading compare.</strong>
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          {buyerPolished ? (
            <>
              Reading shared link parameters (<code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">priorRunId</code> /{" "}
              <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">laterRunId</code>; also accepts{" "}
              <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">leftRunId</code> /{" "}
              <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">rightRunId</code>,{" "}
              <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">baselineRunId</code>,{" "}
              <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">targetRunId</code>) to prefill
              selections…
            </>
          ) : (
            <>
              Reading <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">leftRunId</code> /{" "}
              <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">fromRunId</code> /{" "}
              <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">priorRunId</code> — and{" "}
              <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">rightRunId</code> / sibling keys — from
              the URL so shared compare links open with fields prefilled…
            </>
          )}
        </p>
      </OperatorLoadingNotice>
    </div>
  );
}
