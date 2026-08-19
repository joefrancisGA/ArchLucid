"use client";

import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type OperatorSectionLoadFailureProps = {
  readonly message: string;
  /** Omit when the section has no way to re-fetch; the failure then reads as terminal. */
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly retrying?: boolean;
  readonly testId?: string;
  readonly className?: string;
};

/**
 * Section-level load failure (TB-2380).
 *
 * Distinct from {@link EmptyState}: a failure means the data could not be read and the user should
 * retry, so it takes `role="alert"` and carries its own retry control. An empty state means the
 * read succeeded and there is nothing yet, so it takes `role="status"` and points at a next step.
 * Sections previously rendered failures as bare red text with the retry stranded in the page
 * header, which read as "this section is empty" rather than "this section is broken".
 */
export function OperatorSectionLoadFailure({
  message,
  onRetry,
  retryLabel,
  retrying = false,
  testId,
  className,
}: OperatorSectionLoadFailureProps): React.ReactElement {
  return (
    <div
      role="alert"
      data-testid={testId ?? "operator-section-load-failure"}
      className={cn("flex flex-wrap items-start justify-between gap-3", DESIGN_TOKENS.callout.blocked, className)}
    >
      <p className={cn("m-0 min-w-0 flex-1", OPERATOR_TYPOGRAPHY.body)}>{message}</p>
      {onRetry !== undefined ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={retrying}
          data-testid={`${testId ?? "operator-section-load-failure"}-retry`}
          onClick={onRetry}
        >
          {retrying ? "Retrying…" : (retryLabel ?? "Try again")}
        </Button>
      ) : null}
    </div>
  );
}
