"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { showError } from "@/lib/toast";

const RUN_DEMO_REVIEW_ROUTE = "/api/run-demo-review";

const FALLBACK_ERROR_MESSAGE = "Could not run the demo review. Please try again.";

export type RunDemoReviewButtonProps = {
  readonly className?: string;
  readonly label?: string;
  readonly variant?: NonNullable<ButtonProps["variant"]>;
  readonly size?: NonNullable<ButtonProps["size"]>;
};

type RunDemoReviewResponse = {
  readonly redirectTo?: unknown;
  readonly runDetailUrl?: unknown;
  readonly runId?: unknown;
};

function isRunDemoReviewResponse(value: unknown): value is RunDemoReviewResponse {
  return typeof value === "object" && value !== null;
}

function readRedirectTarget(payload: unknown): string | null {
  if (!isRunDemoReviewResponse(payload)) {
    return null;
  }

  const explicit = payload.redirectTo;

  if (typeof explicit === "string") {
    const trimmed = explicit.trim();

    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  const detailUrl = payload.runDetailUrl;

  if (typeof detailUrl === "string") {
    const trimmed = detailUrl.trim();

    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  const runId = payload.runId;

  if (typeof runId === "string") {
    const trimmed = runId.trim();

    if (trimmed.length > 0) {
      return `/architecture/reviews/${encodeURIComponent(trimmed)}`;
    }
  }

  return null;
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();

    if (isRunDemoReviewResponse(body) && typeof (body as { detail?: unknown }).detail === "string") {
      const detail = (body as { detail: string }).detail.trim();

      if (detail.length > 0) {
        return detail;
      }
    }
  } catch {
    // Non-JSON or empty body — fall through to the generic message below.
  }

  return `${FALLBACK_ERROR_MESSAGE} (status ${response.status})`;
}

/** One-click operator demo review — seeds built-in policy packs and redirects to the generated review. */
export function RunDemoReviewButton({
  className,
  label = "Run demo review",
  variant = "primary",
  size = "default",
}: RunDemoReviewButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = useCallback(async () => {
    setBusy(true);

    try {
      const response = await fetch(RUN_DEMO_REVIEW_ROUTE, {
        method: "POST",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        const detail = await readErrorDetail(response);
        showError(detail);

        return;
      }

      const payload: unknown = await response.json();
      const target = readRedirectTarget(payload);

      if (target === null) {
        showError(FALLBACK_ERROR_MESSAGE);

        return;
      }

      router.push(target);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error && err.message.trim().length > 0 ? err.message : FALLBACK_ERROR_MESSAGE;
      showError(message);
    } finally {
      setBusy(false);
    }
  }, [router]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={busy}
      aria-busy={busy}
      data-testid="run-demo-review-button"
      className={className}
      onClick={() => {
        void onClick();
      }}
    >
      {busy ? "Running demo review…" : label}
    </Button>
  );
}
