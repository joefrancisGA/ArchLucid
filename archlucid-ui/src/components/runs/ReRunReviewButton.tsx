"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { executeArchitectureRunAsync } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import type { ButtonProps } from "@/components/ui/button";

export type ReRunReviewButtonProps = {
  readonly runId: string;
  readonly idleLabel?: string;
  readonly busyLabel?: string;
  readonly variant?: ButtonProps["variant"];
  readonly size?: ButtonProps["size"];
  readonly className?: string;
  readonly "data-testid"?: string;
};

/**
 * Re-invokes agent execution for an existing review (same run id) without routing through Start review intake.
 */
export function ReRunReviewButton(props: ReRunReviewButtonProps): React.JSX.Element {
  const {
    runId,
    idleLabel = "Re-run review",
    busyLabel = "Re-running review…",
    variant = "primary",
    size = "sm",
    className,
    "data-testid": dataTestId = "re-run-review-button",
  } = props;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);

  async function onReRunReview(): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      await executeArchitectureRunAsync(runId);
      router.refresh();
    } catch (e: unknown) {
      if (isApiRequestError(e)) {
        setError({
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      } else {
        setError({
          message: e instanceof Error ? e.message : "Re-run failed.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={busy}
        aria-busy={busy}
        onClick={() => void onReRunReview()}
        data-testid={dataTestId}
      >
        {busy ? busyLabel : idleLabel}
      </Button>
      {error !== null ? (
        <div className="mt-2">
          <OperatorApiProblem
            problem={error.problem}
            fallbackMessage={error.message}
            correlationId={error.correlationId}
            variant="warning"
          />
        </div>
      ) : null}
    </div>
  );
}
