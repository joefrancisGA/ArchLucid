"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import { BUYER_SEED_SAMPLE_WORKSPACE_CTA } from "@/lib/buyer-polish-copy";
import { showError } from "@/lib/toast";

/**
 * V1 Operator Shell — OS-1 (LATEST.md improvement #1).
 *
 * Reviews-empty-state CTA that POSTs to the internal `/api/seed-sample` route handler. On success the route
 * returns `{ redirectTo: "/dashboard" }`; we forward there with `router.push` so the freshly-seeded executive ROI
 * dashboard is visible. Errors surface via the shared sonner toast (`showError`) — the button stays interactive so the
 * operator can retry without a page reload.
 *
 * Static showcase / `SampleFirstReviewPackageCard` flows are intentionally untouched.
 */

const SEED_SAMPLE_ROUTE = "/api/seed-sample";

const FALLBACK_ERROR_MESSAGE = "Could not load the sample workspace. Please try again.";

export type SeedSampleReviewButtonProps = {
  readonly className?: string;
  /** Optional override for the visible label (defaults to "Load sample workspace"). */
  readonly label?: string;
  /** Defaults to outline — this CTA is usually secondary to start-review or demo-review actions. */
  readonly variant?: NonNullable<ButtonProps["variant"]>;
};

type SeedSampleResponse = {
  readonly redirectTo?: unknown;
};

function isSeedSampleResponse(value: unknown): value is SeedSampleResponse {
  return typeof value === "object" && value !== null;
}

function readRedirectTarget(payload: unknown): string | null {
  if (!isSeedSampleResponse(payload)) {
    return null;
  }

  const target = payload.redirectTo;

  if (typeof target !== "string") {
    return null;
  }

  const trimmed = target.trim();

  return trimmed.length > 0 ? trimmed : null;
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();

    if (isSeedSampleResponse(body) && typeof (body as { detail?: unknown }).detail === "string") {
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

export function SeedSampleReviewButton({
  className,
  label = BUYER_SEED_SAMPLE_WORKSPACE_CTA,
  variant = "outline",
}: SeedSampleReviewButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = useCallback(async () => {
    setBusy(true);

    try {
      const response = await fetch(SEED_SAMPLE_ROUTE, {
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
      const target = readRedirectTarget(payload) ?? "/dashboard";

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
      disabled={busy}
      aria-busy={busy}
      data-testid="seed-sample-review-button"
      className={className}
      onClick={() => {
        void onClick();
      }}
    >
      {busy ? "Seeding sample…" : label}
    </Button>
  );
}
