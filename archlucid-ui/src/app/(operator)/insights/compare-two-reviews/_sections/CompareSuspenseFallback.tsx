import { cn } from "@/lib/utils";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Suspense fallback shown while the Compare form client component is initializing (reading URL params). */
export function CompareSuspenseFallback() {
  const buyerPolished = isBuyerPolishedOperatorShellEnv();

  return (
    <div>
      <OperatorLoadingNotice>
        <strong>Loading compare.</strong>
        <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {buyerPolished ? (
            <>Preparing the review comparison…</>
          ) : (
            <>
              Reading <code className={cn("rounded bg-neutral-100 px-1 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.micro)}>leftRunId</code> /{" "}
              <code className={cn("rounded bg-neutral-100 px-1 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.micro)}>fromRunId</code> /{" "}
              <code className={cn("rounded bg-neutral-100 px-1 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.micro)}>priorRunId</code> — and{" "}
              <code className={cn("rounded bg-neutral-100 px-1 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.micro)}>rightRunId</code> / sibling keys — from
              the URL so shared compare links open with fields prefilled…
            </>
          )}
        </p>
      </OperatorLoadingNotice>
    </div>
  );
}
